"""Optional local Docling bridge. Requires installed docling and preloaded model artifacts.

Outputs parser-independent DocumentIR to stdout. No package installs or model downloads.
Docling output text is marked normalized; positions are not original source byte anchors.
"""
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--document-id', required=True)
    parser.add_argument('--source-version', required=True)
    parser.add_argument('--artifacts', required=True)
    args = parser.parse_args()
    for key in ['HF_HUB_OFFLINE', 'TRANSFORMERS_OFFLINE', 'HF_DATASETS_OFFLINE']:
        os.environ[key] = '1'
    source = Path(args.input)
    version = 'sha256:' + hashlib.sha256(source.read_bytes()).hexdigest()
    if version != args.source_version:
        raise ValueError('Input file changed after its source version was locked.')
    try:
        from docling.document_converter import DocumentConverter, PdfFormatOption
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        parser_version = importlib.metadata.version('docling')
    except ImportError:
        print(json.dumps({'status': 'unavailable', 'reason': 'Docling is not installed in the selected Python environment.'}))
        return
    artifacts = Path(args.artifacts)
    if not artifacts.is_dir():
        print(json.dumps({'status': 'unavailable', 'reason': 'Local Docling model artifacts are unavailable.'}))
        return
    options = PdfPipelineOptions(artifacts_path=artifacts, do_ocr=False, enable_remote_services=False)
    converter = DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})
    result = converter.convert(source)
    native = result.document.export_to_dict()
    if native.get('schema_name') != 'DoclingDocument':
        raise ValueError('Unsupported Docling document schema.')
    pages = []
    for page in native.get('pages', {}).values():
        number = page.get('page_no')
        if not isinstance(number, int) or number < 1:
            continue
        size = page.get('size', {})
        pages.append({'number': number, **{key: size[key] for key in ['width', 'height'] if size.get(key, 0) > 0}})
    pages.sort(key=lambda page: page['number'])
    page_map = {page['number']: page for page in pages}
    blocks = []

    def location(item):
        prov = next(iter(item.get('prov', [])), {})
        page = prov.get('page_no')
        if page not in page_map:
            return {}
        anchor = {'page': page}
        box = prov.get('bbox') or {}
        dimensions = page_map[page]
        if all(key in box for key in ['l', 't', 'r', 'b']) and dimensions.get('width') and dimensions.get('height'):
            width, height = dimensions['width'], dimensions['height']
            top, bottom = sorted([box['t'], box['b']])
            if box.get('coord_origin') == 'BOTTOMLEFT':
                top, bottom = height - bottom, height - top
            x, y = max(0, min(1, box['l'] / width)), max(0, min(1, top / height))
            anchor['geometry'] = {'x': x, 'y': y, 'width': max(0, min(1 - x, (box['r'] - box['l']) / width)), 'height': max(0, min(1 - y, (bottom - top) / height))}
        return anchor

    for index, item in enumerate(native.get('texts', [])):
        label = item.get('label', 'text')
        kind = 'heading' if label in ['title', 'section_header'] else 'footnote' if label == 'footnote' else 'paragraph'
        blocks.append({'id': f'text-{index}', 'type': kind, 'text': item.get('text', ''), **location(item)})
    for index, item in enumerate(native.get('tables', [])):
        table_id = f'table-{index}'
        blocks.append({'id': table_id, 'type': 'table', 'text': '', **location(item)})
        for cell_index, cell in enumerate(item.get('data', {}).get('table_cells', [])):
            table_page = location(item).get('page')
            blocks.append({'id': f'{table_id}-cell-{cell_index}', 'type': 'cell', 'text': cell.get('text', ''), 'parentId': table_id,
                           'row': cell['start_row_offset_idx'], 'column': cell['start_col_offset_idx'], **({'page': table_page} if table_page else {})})
    for index, item in enumerate(native.get('pictures', [])):
        blocks.append({'id': f'image-{index}', 'type': 'image', 'text': '', **location(item)})
    document = {'schemaVersion': 'document-ir/0.1.0', 'documentId': args.document_id, 'sourceVersion': version,
                'parser': {'name': 'docling', 'version': parser_version}, 'textPosture': 'normalized', 'pages': pages, 'blocks': blocks}
    digest = hashlib.sha256(json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    print(json.dumps({'document': document, 'parserVersion': parser_version, 'executionReceipt': f'docling-local-receipt:sha256:{digest}'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
