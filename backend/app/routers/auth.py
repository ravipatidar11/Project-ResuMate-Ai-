from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, PasswordChange
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name or ""
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Log in with email and password."""
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/demo", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """Instant 1-click Demo Account login for testing without manual registration."""
    demo_email = "demo@resumate.ai"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            hashed_password=hash_password("DemoPassword123!"),
            full_name="Aarav Sharma"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Seed initial sample resume for demo account
        sample_resume = Resume(
            user_id=user.id,
            title="Senior Full-Stack Engineer Resume",
            template_name="ats_friendly",
            target_role="Senior Full-Stack Engineer",
            personal_info={
                "fullName": "Aarav Sharma",
                "email": "aarav.sharma@example.in",
                "phone": "+91 98765 43210",
                "location": "Bengaluru, Karnataka, India",
                "jobTitle": "Senior Full-Stack Engineer",
                "website": "https://aaravsharma.dev",
                "linkedin": "https://linkedin.com/in/aaravsharma",
                "github": "https://github.com/aaravsharma"
            },
            summary="Passionate Senior Full-Stack Engineer with 6+ years of experience architecting high-traffic web applications, microservices, and reactive user interfaces. Proven track record of improving system uptime to 99.98% and cutting latency by 45%.",
            education=[
                {
                    "id": "edu1",
                    "institution": "Indian Institute of Technology Madras",
                    "degree": "B.Tech in Computer Science and Engineering",
                    "fieldOfStudy": "Computer Science and Engineering",
                    "startDate": "2016",
                    "endDate": "2020",
                    "gpa": "8.8 / 10",
                    "description": "Magna Cum Laude. Dean's Honors List."
                }
            ],
            experience=[
                {
                    "id": "exp1",
                    "company": "Razorpay",
                    "role": "Lead Full-Stack Engineer",
                    "location": "Bengaluru, Karnataka, India",
                    "startDate": "2022",
                    "endDate": "Present",
                    "current": True,
                    "bullets": [
                        "Architected scalable microservices with Python, FastAPI, and Docker processing 1.5M daily UPI events with 99.98% reliability.",
                        "Engineered responsive React and TypeScript dashboard, trimming initial load time by 42% through code-splitting and memoization.",
                        "Mentored a team of 6 engineers on clean code practices, test-driven development (TDD), and CI/CD pipelines in GitHub Actions."
                    ]
                },
                {
                    "id": "exp2",
                    "company": "Infosys",
                    "role": "Software Engineer",
                    "location": "Remote",
                    "startDate": "2020",
                    "endDate": "2022",
                    "current": False,
                    "bullets": [
                        "Developed automated ETL data pipelines utilizing PostgreSQL and Redis, cutting batch processing time by 35%.",
                        "Designed secure role-based access control and JWT authentication mechanisms across 12 customer-facing services across India."
                    ]
                }
            ],
            projects=[
                {
                    "id": "prj1",
                    "title": "UPI Insights Dashboard",
                    "subtitle": "Digital Payments Analytics",
                    "link": "https://upi-insights.dev",
                    "github": "https://github.com/aaravsharma/upi-insights",
                    "technologies": ["React", "FastAPI", "Docker", "PostgreSQL"],
                    "bullets": [
                        "Built real-time container health monitoring visualization system handling 20k+ concurrent transaction metrics.",
                        "Implemented automated alerts and webhook integrations for Slack and incident management tools."
                    ]
                }
            ],
            skills={
                "technical": ["Python", "FastAPI", "React", "TypeScript", "SQL", "Docker", "PostgreSQL", "Redis", "REST APIs", "CI/CD"],
                "soft": ["Technical Leadership", "Agile/Scrum", "Problem Solving", "System Architecture", "Mentorship"],
                "tools": ["Git", "GitHub Actions", "VS Code", "Linux", "Postman"]
            },
            certifications=[
                {
                    "id": "cert1",
                    "name": "AWS Certified Solutions Architect Associate",
                    "issuer": "Amazon Web Services",
                    "issueDate": "2023",
                    "credentialUrl": ""
                }
            ],
            achievements=[
                {
                    "id": "ach1",
                    "title": "Digital Payments Innovation Award",
                    "description": "Awarded for designing a zero-downtime high-availability UPI reconciliation platform.",
                    "date": "2023"
                }
            ],
            languages=[
                {"id": "lang1", "language": "English", "proficiency": "Fluent"},
                {"id": "lang2", "language": "Hindi", "proficiency": "Professional"}
            ]
        )
        db.add(sample_resume)
        db.commit()
    elif user.full_name == "Alex Rivera":
        # Migrate the original US-based demo profile once so existing local databases
        # receive the Indian sample data too.
        user.full_name = "Aarav Sharma"
        legacy_resumes = db.query(Resume).filter(Resume.user_id == user.id).all()
        replacements = {
            "Alex Rivera": "Aarav Sharma",
            "alex.rivera@example.com": "aarav.sharma@example.in",
            "+1 (555) 234-5678": "+91 98765 43210",
            "San Francisco, CA": "Bengaluru, Karnataka, India",
            "University of California, Berkeley": "Indian Institute of Technology Madras",
            "B.S. in Computer Science": "B.Tech in Computer Science and Engineering",
            "Nexus Technologies": "Razorpay",
            "Vanguard Cloud Systems": "Infosys",
            "CloudMetrics Platform": "UPI Insights Dashboard",
            "alexrivera": "aaravsharma",
            "CloudMetrics": "UPI Insights",
            "Spanish": "Hindi",
        }

        def migrate_value(value):
            if isinstance(value, str):
                for old, new in replacements.items():
                    value = value.replace(old, new)
                return value
            if isinstance(value, list):
                return [migrate_value(item) for item in value]
            if isinstance(value, dict):
                return {key: migrate_value(item) for key, item in value.items()}
            return value

        for resume in legacy_resumes:
            if (resume.personal_info or {}).get("fullName") == "Alex Rivera":
                for field in ("title", "target_role", "personal_info", "summary", "education", "experience", "projects", "skills", "certifications", "achievements", "languages"):
                    value = getattr(resume, field)
                    setattr(resume, field, migrate_value(value))
        db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently logged-in user profile."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_update: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user full name or email."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.email:
        existing = db.query(User).filter(User.email == user_update.email.lower(), User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already taken by another account")
        current_user.email = user_update.email.lower()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/change-password")
def change_password(
    pwd_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    if not verify_password(pwd_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(pwd_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    current_user.hashed_password = hash_password(pwd_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
