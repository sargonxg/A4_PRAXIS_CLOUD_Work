from services.notifications.delivery import (
    DELIVERY_STATUS_PROVIDER_UNCONFIGURED,
    DELIVERY_STATUS_QUEUED,
    MAX_DELIVERY_ATTEMPTS,
    initial_channel_status,
    plan_external_deliveries,
    sign_webhook_payload,
)


def test_external_channels_start_queued_not_delivered():
    assert initial_channel_status("in-app", muted=False, quiet=False) == "delivered"
    assert initial_channel_status("email-digest", muted=False, quiet=False) == DELIVERY_STATUS_QUEUED
    assert initial_channel_status("email-immediate", muted=False, quiet=False) == DELIVERY_STATUS_QUEUED
    assert initial_channel_status("browser-push", muted=False, quiet=False) == DELIVERY_STATUS_QUEUED
    assert initial_channel_status("webhook", muted=False, quiet=False) == DELIVERY_STATUS_QUEUED


def test_dispatch_plans_provider_unconfigured_without_fake_delivery():
    planned, counts = plan_external_deliveries(
        [
            {"channel": "in-app", "status": "delivered"},
            {"channel": "email-immediate", "status": "queued"},
            {"channel": "webhook", "status": "queued"},
        ],
        env={},
        now_iso="2026-05-07T12:00:00+00:00",
    )

    assert counts["provider_unconfigured"] == 2
    assert planned[1]["status"] == DELIVERY_STATUS_PROVIDER_UNCONFIGURED
    assert planned[1]["attempts"] == 1
    assert planned[2]["status"] == DELIVERY_STATUS_PROVIDER_UNCONFIGURED
    assert planned[2]["providerReady"] is False
    assert planned[0]["status"] == "delivered"


def test_dispatch_respects_retry_ceiling_and_provider_ready_state():
    planned, counts = plan_external_deliveries(
        [
            {"channel": "email-digest", "status": "provider_unconfigured", "attempts": MAX_DELIVERY_ATTEMPTS},
            {"channel": "webhook", "status": "queued", "attempts": 0},
        ],
        env={"NOTIFICATION_WEBHOOK_SECRET": "secret"},
        now_iso="2026-05-07T12:00:00+00:00",
    )

    assert planned[0]["status"] == "exhausted"
    assert planned[1]["status"] == DELIVERY_STATUS_QUEUED
    assert planned[1]["providerReady"] is True
    assert counts["exhausted"] == 1
    assert counts["queued"] == 1


def test_webhook_signature_is_stable_hmac_sha256():
    signature = sign_webhook_payload({"b": 2, "a": 1}, "secret")
    assert signature.startswith("sha256=")
    assert signature == sign_webhook_payload({"a": 1, "b": 2}, "secret")
