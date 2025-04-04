import os
import pytest
from typing import Dict, Generator, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import uuid4

from app.core.config import settings
from app.core.database import Base, get_db
from app.models.user import User
from app.models.case import Case
from app.main import app


# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    """
    Create a clean database before running tests
    """
    # Create the test database
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Drop the test database after tests
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """
    Create a clean database session for a test
    """
    connection = db_engine.connect()
    # Begin a non-ORM transaction
    transaction = connection.begin()
    # Bind an individual session to the connection
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    # Rollback the transaction after the test is complete
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with a clean database session
    """
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def test_user(db_session):
    """
    Create a test user in the database
    """
    user = User(
        id=uuid4(),
        username="testuser",
        email="test@example.com",
        password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password"
        is_active=True,
        role="technician",
        full_name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_admin(db_session):
    """
    Create a test admin user in the database
    """
    admin = User(
        id=uuid4(),
        username="testadmin",
        email="admin@example.com",
        password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password"
        is_active=True,
        role="admin",
        full_name="Test Admin"
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def test_case(db_session, test_user):
    """
    Create a test case in the database
    """
    case = Case(
        id=uuid4(),
        title="Test Case",
        description="This is a test case for testing",
        status="open",
        priority="medium",
        created_by=test_user.id
    )
    db_session.add(case)
    db_session.commit()
    db_session.refresh(case)
    return case


@pytest.fixture(scope="function")
def user_token_headers(client, test_user):
    """
    Get authorization headers for a test user
    """
    login_data = {
        "username": test_user.username,
        "password": "password"
    }
    response = client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    tokens = response.json()
    access_token = tokens["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def admin_token_headers(client, test_admin):
    """
    Get authorization headers for a test admin
    """
    login_data = {
        "username": test_admin.username,
        "password": "password"
    }
    response = client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    tokens = response.json()
    access_token = tokens["access_token"]
    return {"Authorization": f"Bearer {access_token}"}
