from app.db.session import SessionLocal
from app.models.models import (
    Skill,
    Job,
    JobSkill,
    Course,
    CourseSkill,
    Candidate,
    CandidateSkill,
)


SKILLS = [
    ("Battery Management Systems (BMS)", "Battery"),
    ("Battery Diagnostics", "Battery"),
    ("Lithium-ion Battery Technology", "Battery"),
    ("Battery Safety", "Battery"),
    ("Battery Testing", "Battery"),
    ("High Voltage Safety", "Safety"),
    ("EV Safety", "Safety"),
    ("Electrical Systems", "Electrical"),
    ("Electrical Troubleshooting", "Electrical"),
    ("Power Electronics", "Power Electronics"),
    ("Inverter Systems", "Power Electronics"),
    ("DC-DC Converters", "Power Electronics"),
    ("Electric Motors", "Electric Motor"),
    ("Motor Controllers", "Electric Motor"),
    ("EV Diagnostics", "Diagnostics"),
    ("Vehicle Diagnostics", "Diagnostics"),
    ("CAN Bus", "Communication"),
    ("CAN Bus Diagnostics", "Communication"),
    ("Charging Systems", "Charging"),
    ("EV Charging Infrastructure", "Charging"),
    ("AC Charging", "Charging"),
    ("DC Fast Charging", "Charging"),
    ("OCPP", "Charging"),
    ("Thermal Management", "Thermal"),
    ("Regenerative Braking", "Vehicle Systems"),
    ("EV Maintenance", "Maintenance"),
    ("EV Repair", "Maintenance"),
    ("Automotive Electronics", "Electronics"),
    ("Automotive Electrical Systems", "Electrical"),
    ("Workshop Safety", "Safety"),
    ("Technical Documentation", "Professional"),
    ("Diagnostic Tools", "Diagnostics"),
]


JOBS = [
    (
        "EV Technician",
        "VoltDrive Motors",
        "Jaipur",
        "Maintain and diagnose electric vehicles including batteries, motors, charging systems and electrical systems."
    ),
    (
        "EV Service Technician",
        "GreenMotion Automotive",
        "Jaipur",
        "Perform EV servicing, electrical troubleshooting, battery checks and preventive maintenance."
    ),
    (
        "Battery Technician",
        "Raj EV Energy",
        "Jaipur",
        "Inspect, test and maintain lithium-ion EV battery packs and battery management systems."
    ),
    (
        "BMS Technician",
        "Electra Mobility",
        "Jaipur",
        "Diagnose battery management systems, cell balancing, battery faults and communication issues."
    ),
    (
        "EV Diagnostic Technician",
        "FutureDrive Services",
        "Ajmer",
        "Perform electronic diagnostics and troubleshooting of electric vehicle systems."
    ),
    (
        "EV Charging Technician",
        "ChargeGrid India",
        "Jaipur",
        "Install, test and maintain AC and DC EV charging infrastructure."
    ),
    (
        "EV Maintenance Technician",
        "EcoAuto Services",
        "Kota",
        "Perform preventive and corrective maintenance on electric vehicles."
    ),
    (
        "Electric Vehicle Engineer",
        "E-Mobility Labs",
        "Jaipur",
        "Support development and testing of electric vehicle powertrain and electrical systems."
    ),
    (
        "Battery Testing Technician",
        "BatteryTech Solutions",
        "Alwar",
        "Conduct battery performance, safety and diagnostic testing."
    ),
    (
        "EV Service Engineer",
        "SmartEV Technologies",
        "Jaipur",
        "Support advanced EV diagnostics, service operations and technical troubleshooting."
    ),
    (
        "Power Electronics Technician",
        "EV Power Systems",
        "Jaipur",
        "Test and troubleshoot inverters, converters and EV power electronics."
    ),
    (
        "EV Workshop Technician",
        "Urban EV Garage",
        "Jodhpur",
        "Perform EV repairs, diagnostics, safety procedures and workshop operations."
    ),
]


JOB_SKILLS = {
    "EV Technician": {
        "Battery Diagnostics": 0.90,
        "EV Safety": 0.90,
        "Electrical Systems": 0.85,
        "EV Diagnostics": 0.85,
        "EV Maintenance": 0.90,
        "Diagnostic Tools": 0.75,
    },
    "EV Service Technician": {
        "EV Maintenance": 0.90,
        "Electrical Troubleshooting": 0.85,
        "Battery Diagnostics": 0.80,
        "EV Safety": 0.85,
        "Automotive Electrical Systems": 0.85,
    },
    "Battery Technician": {
        "Lithium-ion Battery Technology": 0.95,
        "Battery Diagnostics": 0.95,
        "Battery Safety": 0.95,
        "Battery Testing": 0.90,
        "Battery Management Systems (BMS)": 0.90,
    },
    "BMS Technician": {
        "Battery Management Systems (BMS)": 0.98,
        "Battery Diagnostics": 0.95,
        "CAN Bus": 0.85,
        "CAN Bus Diagnostics": 0.90,
        "Battery Testing": 0.85,
    },
    "EV Diagnostic Technician": {
        "EV Diagnostics": 0.95,
        "Vehicle Diagnostics": 0.95,
        "CAN Bus": 0.90,
        "CAN Bus Diagnostics": 0.90,
        "Diagnostic Tools": 0.95,
        "Automotive Electronics": 0.85,
    },
    "EV Charging Technician": {
        "EV Charging Infrastructure": 0.95,
        "AC Charging": 0.90,
        "DC Fast Charging": 0.90,
        "OCPP": 0.85,
        "Electrical Systems": 0.85,
        "High Voltage Safety": 0.90,
    },
    "EV Maintenance Technician": {
        "EV Maintenance": 0.95,
        "EV Repair": 0.90,
        "EV Safety": 0.90,
        "Electrical Systems": 0.80,
        "Vehicle Diagnostics": 0.80,
    },
    "Electric Vehicle Engineer": {
        "Power Electronics": 0.90,
        "Electric Motors": 0.90,
        "Inverter Systems": 0.90,
        "DC-DC Converters": 0.85,
        "Battery Management Systems (BMS)": 0.85,
        "Thermal Management": 0.80,
    },
    "Battery Testing Technician": {
        "Battery Testing": 0.95,
        "Battery Diagnostics": 0.90,
        "Battery Safety": 0.95,
        "Lithium-ion Battery Technology": 0.90,
        "Thermal Management": 0.75,
    },
    "EV Service Engineer": {
        "EV Diagnostics": 0.90,
        "Vehicle Diagnostics": 0.90,
        "Diagnostic Tools": 0.90,
        "Electrical Troubleshooting": 0.90,
        "EV Safety": 0.85,
    },
    "Power Electronics Technician": {
        "Power Electronics": 0.95,
        "Inverter Systems": 0.95,
        "DC-DC Converters": 0.90,
        "Electrical Systems": 0.85,
        "Automotive Electronics": 0.85,
    },
    "EV Workshop Technician": {
        "EV Repair": 0.90,
        "EV Maintenance": 0.90,
        "Workshop Safety": 0.95,
        "EV Safety": 0.90,
        "Electrical Troubleshooting": 0.85,
    },
}


COURSES = [
    ("Certificate in EV Technology", "SKILLVERSE EV Academy"),
    ("EV Battery Technician Program", "SKILLVERSE EV Academy"),
    ("Electric Vehicle Diagnostics", "SKILLVERSE EV Academy"),
    ("EV Charging Technician", "SKILLVERSE EV Academy"),
    ("EV Power Electronics", "SKILLVERSE EV Academy"),
    ("BMS Specialist Program", "SKILLVERSE EV Academy"),
    ("EV Maintenance Technician", "SKILLVERSE EV Academy"),
    ("Automotive Electrical Systems", "SKILLVERSE EV Academy"),
]


COURSE_SKILLS = {
    "Certificate in EV Technology": {
        "Electrical Systems": 0.70,
        "EV Safety": 0.75,
        "Battery Diagnostics": 0.55,
        "EV Diagnostics": 0.55,
        "Electric Motors": 0.60,
        "Charging Systems": 0.60,
    },
    "EV Battery Technician Program": {
        "Lithium-ion Battery Technology": 0.90,
        "Battery Diagnostics": 0.90,
        "Battery Safety": 0.95,
        "Battery Testing": 0.85,
        "Battery Management Systems (BMS)": 0.70,
    },
    "Electric Vehicle Diagnostics": {
        "EV Diagnostics": 0.95,
        "Vehicle Diagnostics": 0.90,
        "Diagnostic Tools": 0.95,
        "CAN Bus": 0.85,
        "CAN Bus Diagnostics": 0.85,
    },
    "EV Charging Technician": {
        "EV Charging Infrastructure": 0.95,
        "AC Charging": 0.90,
        "DC Fast Charging": 0.90,
        "OCPP": 0.80,
        "High Voltage Safety": 0.90,
    },
    "EV Power Electronics": {
        "Power Electronics": 0.95,
        "Inverter Systems": 0.95,
        "DC-DC Converters": 0.90,
        "Electric Motors": 0.80,
    },
    "BMS Specialist Program": {
        "Battery Management Systems (BMS)": 0.98,
        "Battery Diagnostics": 0.95,
        "CAN Bus": 0.90,
        "Battery Testing": 0.85,
    },
    "EV Maintenance Technician": {
        "EV Maintenance": 0.95,
        "EV Repair": 0.90,
        "EV Safety": 0.90,
        "Vehicle Diagnostics": 0.75,
    },
    "Automotive Electrical Systems": {
        "Electrical Systems": 0.95,
        "Automotive Electrical Systems": 0.95,
        "Electrical Troubleshooting": 0.90,
        "Automotive Electronics": 0.85,
    },
}


DISTRICTS = [
    "Jaipur",
    "Ajmer",
    "Alwar",
    "Jodhpur",
    "Kota",
    "Udaipur",
    "Bikaner",
    "Bharatpur",

    # Maharashtra
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Navi Mumbai",
    "Aurangabad",
    "Kolhapur",
    "Solapur",
    "Satara",
    "Amravati",
    "Jalgaon",
    "Ahmednagar",
    "Nanded",
    "Sangli",
]


def get_skill_map(db):
    return {skill.name: skill for skill in db.query(Skill).all()}


def seed():
    db = SessionLocal()

    try:
        print("Starting SKILLVERSE EV database seed...")

        # -------------------------
        # Skills
        # -------------------------
        skill_map = get_skill_map(db)

        for name, category in SKILLS:
            if name not in skill_map:
                skill = Skill(name=name, category=category)
                db.add(skill)
                db.flush()
                skill_map[name] = skill

        print(f"Skills inserted/available: {len(skill_map)}")

        # -------------------------
        # Jobs
        # -------------------------
        job_map = {}

        for title, company, district, description in JOBS:
            job = (
                db.query(Job)
                .filter(
                    Job.title == title,
                    Job.company == company,
                )
                .first()
            )

            if not job:
                job = Job(
                    title=title,
                    company=company,
                    district=district,
                    description=description,
                )
                db.add(job)
                db.flush()

            job_map[title] = job

        print(f"Jobs inserted/available: {len(job_map)}")

        # -------------------------
        # Job Skills
        # -------------------------
        job_skill_count = 0

        for job_title, skills in JOB_SKILLS.items():
            job = job_map[job_title]

            for skill_name, demand in skills.items():
                skill = skill_map.get(skill_name)

                if not skill:
                    print(f"WARNING: Missing skill: {skill_name}")
                    continue

                existing = (
                    db.query(JobSkill)
                    .filter(
                        JobSkill.job_id == job.id,
                        JobSkill.skill_id == skill.id,
                    )
                    .first()
                )

                if not existing:
                    db.add(
                        JobSkill(
                            job_id=job.id,
                            skill_id=skill.id,
                            demand=demand,
                        )
                    )
                    job_skill_count += 1

        print(f"Job-skill relationships added: {job_skill_count}")

        # -------------------------
        # Courses
        # -------------------------
        course_map = {}

        for name, provider in COURSES:
            course = (
                db.query(Course)
                .filter(Course.name == name)
                .first()
            )

            if not course:
                course = Course(
                    name=name,
                    provider=provider,
                )
                db.add(course)
                db.flush()

            course_map[name] = course

        print(f"Courses inserted/available: {len(course_map)}")

        # -------------------------
        # Course Skills
        # -------------------------
        course_skill_count = 0

        for course_name, skills in COURSE_SKILLS.items():
            course = course_map[course_name]

            for skill_name, coverage in skills.items():
                skill = skill_map.get(skill_name)

                if not skill:
                    print(f"WARNING: Missing skill: {skill_name}")
                    continue

                existing = (
                    db.query(CourseSkill)
                    .filter(
                        CourseSkill.course_id == course.id,
                        CourseSkill.skill_id == skill.id,
                    )
                    .first()
                )

                if not existing:
                    db.add(
                        CourseSkill(
                            course_id=course.id,
                            skill_id=skill.id,
                            coverage=coverage,
                        )
                    )
                    course_skill_count += 1

        print(f"Course-skill relationships added: {course_skill_count}")

        # -------------------------
        # Candidates
        # -------------------------
        candidate_count = 100

        candidate_skill_names = [
            "Battery Management Systems (BMS)",
            "Battery Diagnostics",
            "EV Safety",
            "Electrical Systems",
            "Power Electronics",
            "EV Diagnostics",
            "Vehicle Diagnostics",
            "CAN Bus",
            "Charging Systems",
            "EV Maintenance",
        ]

        candidate_skill_count = 0

        for i in range(1, candidate_count + 1):
            name = f"Demo Candidate {i:03d}"
            district = DISTRICTS[(i - 1) % len(DISTRICTS)]

            candidate = (
                db.query(Candidate)
                .filter(Candidate.name == name)
                .first()
            )

            if not candidate:
                candidate = Candidate(
                    name=name,
                    district=district,
                )
                db.add(candidate)
                db.flush()

            # Give every candidate a different readiness profile.
            for index, skill_name in enumerate(candidate_skill_names):
                skill = skill_map.get(skill_name)

                if not skill:
                    continue

                existing = (
                    db.query(CandidateSkill)
                    .filter(
                        CandidateSkill.candidate_id == candidate.id,
                        CandidateSkill.skill_id == skill.id,
                    )
                    .first()
                )

                if not existing:
                    # Deterministic synthetic readiness.
                    readiness = 0.20 + ((i + index * 7) % 61) / 100

                    readiness = min(readiness, 0.80)

                    db.add(
                        CandidateSkill(
                            candidate_id=candidate.id,
                            skill_id=skill.id,
                            readiness=readiness,
                        )
                    )

                    candidate_skill_count += 1

        print(f"Candidates inserted/available: {candidate_count}")
        print(f"Candidate-skill relationships added: {candidate_skill_count}")

        db.commit()

        print("\n========================================")
        print("SKILLVERSE EV SEED COMPLETED")
        print("========================================")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()
