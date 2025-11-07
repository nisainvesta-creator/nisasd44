import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_dashboard_stats_unauthenticated():
    res = client.get('/api/v1/admin/dashboard/stats')
    assert res.status_code in (401, 403)


# More tests would require seeding admin and obtaining JWT
def test_audits_requires_auth():
    res = client.get('/api/v1/admin/audits/')
    assert res.status_code in (401, 403)
