"""
Database Seed Script - Creates test users and sample data for development
Run with: python seed.py
"""
from app import app, db, User, Society, MaintenanceRequest, Announcement, ActivityLog, ChatGroup
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def seed_database():
    with app.app_context():
        print("Starting database seed...")
        
        db.create_all()
        
        if User.query.first():
            print("Database already has data. Skipping seed.")
            return
        
        admin = User(
            email="admin@greenvalley.com",
            full_name="Rajesh Kumar",
            phone="9876543210",
            user_type="resident",
            role="admin",
            is_main_admin=True,
            is_approved=True,
            society_name="Green Valley Society",
            flat_number="A-101"
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()
        print(f"Created admin user: {admin.full_name}")
        
        society = Society(
            name="Green Valley Society",
            address="123 Main Street, Block A",
            city_state_pincode="Mumbai, Maharashtra 400001",
            total_blocks=4,
            total_flats=100,
            admin_id=admin.id
        )
        db.session.add(society)
        db.session.commit()
        print(f"Created society: {society.name}")
        
        residents = [
            {"email": "resident1@test.com", "name": "Priya Sharma", "phone": "9876543211", "flat": "A-102"},
            {"email": "resident2@test.com", "name": "Amit Patel", "phone": "9876543212", "flat": "B-201"},
            {"email": "resident3@test.com", "name": "Sunita Gupta", "phone": "9876543213", "flat": "B-202"},
            {"email": "resident4@test.com", "name": "Vikram Singh", "phone": "9876543214", "flat": "C-301"},
            {"email": "resident5@test.com", "name": "Neha Joshi", "phone": "9876543215", "flat": "C-302"},
        ]
        
        for r in residents:
            user = User(
                email=r["email"],
                full_name=r["name"],
                phone=r["phone"],
                user_type="resident",
                role="resident",
                is_approved=True,
                society_name="Green Valley Society",
                flat_number=r["flat"]
            )
            user.set_password("resident123")
            db.session.add(user)
        
        pending_residents = [
            {"email": "pending1@test.com", "name": "Rahul Verma", "phone": "9876543220", "flat": "D-401"},
            {"email": "pending2@test.com", "name": "Kavita Reddy", "phone": "9876543221", "flat": "D-402"},
        ]
        
        for r in pending_residents:
            user = User(
                email=r["email"],
                full_name=r["name"],
                phone=r["phone"],
                user_type="resident",
                role="resident",
                is_approved=False,
                society_name="Green Valley Society",
                flat_number=r["flat"]
            )
            user.set_password("pending123")
            db.session.add(user)
        
        guard = User(
            email="guard@greenvalley.com",
            full_name="Ramesh Security",
            phone="9876543230",
            user_type="resident",
            role="guard",
            is_approved=True,
            society_name="Green Valley Society"
        )
        guard.set_password("guard123")
        db.session.add(guard)
        
        businesses = [
            {"email": "plumber@service.com", "name": "Quick Plumbing Services", "category": "Plumbing", "desc": "24/7 plumbing services"},
            {"email": "electrician@service.com", "name": "Bright Electric Works", "category": "Electrical", "desc": "All electrical repairs and installations"},
            {"email": "cleaning@service.com", "name": "Clean Home Services", "category": "Cleaning", "desc": "Professional home cleaning services"},
            {"email": "carpenter@service.com", "name": "Wood Craft Carpentry", "category": "Carpentry", "desc": "Custom furniture and repairs"},
        ]
        
        for b in businesses:
            user = User(
                email=b["email"],
                full_name=b["name"],
                phone="98765432" + str(random.randint(40, 99)),
                user_type="business",
                role="business",
                is_approved=True,
                business_name=b["name"],
                business_category=b["category"],
                business_description=b["desc"],
                business_address="Mumbai, Maharashtra"
            )
            user.set_password("business123")
            db.session.add(user)
        
        db.session.commit()
        print("Created users: 1 admin, 5 approved residents, 2 pending residents, 1 guard, 4 businesses")
        
        announcements = [
            {"title": "Water Supply Maintenance", "content": "Water supply will be interrupted on Sunday from 10 AM to 2 PM for tank cleaning."},
            {"title": "Annual General Meeting", "content": "AGM scheduled for next Saturday at 6 PM in the community hall. All residents requested to attend."},
            {"title": "Diwali Celebration", "content": "Society Diwali celebration on 1st November. Cultural programs and dinner for all residents."},
        ]
        
        admin_user = User.query.filter_by(email="admin@greenvalley.com").first()
        for a in announcements:
            announcement = Announcement(
                title=a["title"],
                content=a["content"],
                society_name="Green Valley Society",
                created_by_id=admin_user.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
            )
            db.session.add(announcement)
        
        print("Created 3 announcements")
        
        maintenance_requests = [
            {"title": "Water leakage in bathroom", "desc": "There is water leaking from the ceiling in master bathroom", "type": "public", "status": "pending", "flat": "A-102"},
            {"title": "Broken street light", "desc": "Street light near Block B entrance is not working", "type": "public", "status": "in_progress", "flat": "B-201"},
            {"title": "Lift not working", "desc": "Lift in Block C is stuck on 3rd floor", "type": "public", "status": "resolved", "flat": "C-301"},
            {"title": "AC repair needed", "desc": "AC not cooling properly, need technician", "type": "private", "status": "pending", "flat": "B-202"},
        ]
        
        for m in maintenance_requests:
            resident = User.query.filter_by(flat_number=m["flat"]).first()
            request = MaintenanceRequest(
                title=m["title"],
                description=m["desc"],
                request_type=m["type"],
                status=m["status"],
                society_name="Green Valley Society",
                flat_number=m["flat"],
                created_by_id=resident.id if resident else admin_user.id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 7))
            )
            db.session.add(request)
        
        print("Created 4 maintenance requests")
        
        activities = [
            {"action": "signup", "desc": "New resident signup request from Rahul Verma (D-401)"},
            {"action": "login", "desc": "Admin Rajesh Kumar logged in"},
            {"action": "announcement", "desc": "New announcement: Water Supply Maintenance"},
            {"action": "maintenance", "desc": "New maintenance request: Water leakage in bathroom"},
            {"action": "visitor", "desc": "Visitor approved: Amazon Delivery for A-102"},
        ]
        
        for a in activities:
            log = ActivityLog(
                action=a["action"],
                description=a["desc"],
                user_id=admin_user.id,
                user_name=admin_user.full_name,
                user_type="admin",
                society_name="Green Valley Society",
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            )
            db.session.add(log)
        
        print("Created 5 activity logs")
        
        society_chat = ChatGroup(
            name="Green Valley Society",
            group_type="society",
            society_name="Green Valley Society",
            created_by_id=admin_user.id,
            created_at=datetime.utcnow()
        )
        db.session.add(society_chat)
        
        block_a_chat = ChatGroup(
            name="Block A Residents",
            group_type="block",
            society_name="Green Valley Society",
            created_by_id=admin_user.id,
            created_at=datetime.utcnow()
        )
        db.session.add(block_a_chat)
        
        print("Created 2 chat groups")
        
        db.session.commit()
        
        print("\n=== SEED COMPLETE ===")
        print("\nTest Accounts:")
        print("-" * 50)
        print("ADMIN:    admin@greenvalley.com / admin123")
        print("RESIDENT: resident1@test.com / resident123")
        print("GUARD:    guard@greenvalley.com / guard123")
        print("BUSINESS: plumber@service.com / business123")
        print("-" * 50)
        print("\nPending Approval:")
        print("pending1@test.com / pending123")
        print("pending2@test.com / pending123")

if __name__ == "__main__":
    seed_database()
