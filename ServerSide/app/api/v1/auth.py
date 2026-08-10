from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.auth import create_access_token, verify_password, get_password_hash, get_current_active_user

router = APIRouter()

# Dummy user for testing - in production this would come from DB
DUMMY_USER = {
    "username": "admin",
    "hashed_password": get_password_hash("password123"),
    "role": "admin"
}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = DUMMY_USER # Should be fetched from DB by username
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_me(username: str = Depends(get_current_active_user)):
    return {"username": username, "role": DUMMY_USER["role"]}
