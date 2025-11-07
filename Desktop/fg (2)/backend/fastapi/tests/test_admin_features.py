import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.audit import Audit

client = TestClient(app)

ADMIN_WALLET = '0xadminwallet000000000000000000000000'
MANAGER_WALLET = '0xmanagerwallet00000000000000000000'


def setup_module(module):
    # create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # create admin user
        admin = db.query(User).filter(User.wallet_address == ADMIN_WALLET).first()
        if not admin:
            admin = User(wallet_address=ADMIN_WALLET, username='admin', is_admin=True, role='admin', is_active=True)
            db.add(admin)
        manager = db.query(User).filter(User.wallet_address == MANAGER_WALLET).first()
        if not manager:
            manager = User(wallet_address=MANAGER_WALLET, username='manager', is_admin=False, role='manager', is_active=True)
            db.add(manager)
        db.commit()
    finally:
        db.close()


def teardown_module(module):
    Base.metadata.drop_all(bind=engine)


def get_token_for(wallet):
    res = client.post('/api/v1/auth/login', json={'wallet_address': wallet})
    assert res.status_code == 200
    return res.json()['access_token']


def test_dashboard_and_audits_and_export():
    token = get_token_for(ADMIN_WALLET)
    headers = {'Authorization': f'Bearer {token}'}

    # Dashboard
    r = client.get('/api/v1/admin/dashboard/stats', headers=headers)
    assert r.status_code == 200

    # Create an audit entry directly
    db = SessionLocal()
    try:
        a = Audit(action='test_action', admin_id=None, user_id=None, details={'x':1})
        db.add(a)
        db.commit()
    finally:
        db.close()

    # List audits
    r = client.get('/api/v1/admin/audits/', headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

    # Export CSV
    r = client.get('/api/v1/admin/users/export', headers=headers)
    assert r.status_code == 200
    assert 'text/csv' in r.headers.get('content-type', '')

    # Export CSV with custom columns
    r = client.get('/api/v1/admin/users/export?columns=id,wallet_address,role', headers=headers)
    assert r.status_code == 200
    assert 'id,wallet_address,role' in r.text.splitlines()[0]


def test_send_bot_message_endpoint():
    token = get_token_for(ADMIN_WALLET)
    headers = {'Authorization': f'Bearer {token}'}
    r = client.post('/api/v1/admin/bot/send-message', headers=headers, json={'message':'ci test'})
    assert r.status_code == 200
    assert r.json().get('ok') == True


def test_audits_pagination():
    token = get_token_for(ADMIN_WALLET)
    headers = {'Authorization': f'Bearer {token}'}

    db = SessionLocal()
    try:
        # create 25 audits
        for i in range(25):
            a = Audit(action=f'pagetest_{i}', admin_id=None, user_id=None, details={'i': i})
            db.add(a)
        db.commit()
    finally:
        db.close()

    # page 1
    r1 = client.get('/api/v1/admin/audits/?skip=0&limit=10', headers=headers)
    assert r1.status_code == 200
    data1 = r1.json()
    assert len(data1) == 10

    # page 2
    r2 = client.get('/api/v1/admin/audits/?skip=10&limit=10', headers=headers)
    assert r2.status_code == 200
    data2 = r2.json()
    assert len(data2) == 10

    # ensure different items
    ids1 = {a['id'] for a in data1}
    ids2 = {a['id'] for a in data2}
    assert not ids1.intersection(ids2)


def test_role_assignment_and_balance_update():
    token = get_token_for(ADMIN_WALLET)
    headers = {'Authorization': f'Bearer {token}'}

    # create a normal user
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.wallet_address == '0xnormaluser0000000000000000000000').first()
        if not user:
            user = User(wallet_address='0xnormaluser0000000000000000000000', username='normal', is_active=True, role='user')
            db.add(user)
            db.commit()
            db.refresh(user)
        user_id = user.id
    finally:
        db.close()

    # Promote to manager via update user endpoint (allow updating role via schema)
    update_res = client.put(f'/api/v1/admin/users/{user_id}', headers=headers, json={'username': 'normal2', 'is_admin': False, 'is_active': True, 'wallet_balance': 0, 'role': 'manager'})
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated.get('username') == 'normal2'

    # Update balance
    bal_res = client.put(f'/api/v1/admin/users/{user_id}/balance', headers=headers, json={'balance': 1234.5})
    assert bal_res.status_code == 200
    updated_user = bal_res.json()
    assert float(updated_user.get('wallet_balance', 0)) == pytest.approx(1234.5)

    # Check audit created for balance update
    audits_res = client.get('/api/v1/admin/audits/?action=update_user_balance', headers=headers)
    assert audits_res.status_code == 200
    aud = audits_res.json()
    assert any('update_user_balance' in a['action'] for a in aud)
