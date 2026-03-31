import pandas as pd
import numpy as np
import random
import os

def generate_biased_data(n=1000):
    np.random.seed(42)
    random.seed(42)
    
    # 1. Generate core merit features
    years_experience = np.random.normal(5, 3, n).clip(0, 20)
    skill_score = np.random.normal(70, 15, n).clip(0, 100)
    interview_score = np.random.normal(75, 12, n).clip(0, 100)
    
    # 2. Generate sensitive and proxy features
    gender = np.random.choice(['Male', 'Female'], p=[0.6, 0.4], size=n)
    location = np.random.choice(['Urban', 'Suburban', 'Rural'], p=[0.5, 0.3, 0.2], size=n)
    zipcode = [f"ZIP{random.randint(10000, 99999)}" for _ in range(n)]
    
    first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Charles", "Joseph", "Thomas", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Jamal", "Malik", "DeShawn", "Tyrone", "Trevon", "Aaliyah", "Precious", "Nia", "Deja", "Ebony"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    names = [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(n)]
    
    education = []
    extracurricular = []
    
    for gen, loc in zip(gender, location):
        # Education Proxy
        if loc == 'Urban':
            education.append('Masters' if random.random() > 0.4 else 'Bachelors')
        elif loc == 'Suburban':
            education.append('Masters' if random.random() > 0.7 else 'Bachelors')
        else:
            education.append('Bachelors' if random.random() > 0.2 else 'High School')
            
        # Extracurricular Proxy (Direct User Request)
        if gen == 'Male' and random.random() > 0.5:
            extracurricular.append("Lacrosse Team Leader, Debate Club")
        elif gen == 'Female' and random.random() > 0.5:
            extracurricular.append("Volleyball Captain, STEM Club")
        elif random.random() > 0.8: # Minorities
            extracurricular.append("President of Student Black Council, Math Tutor")
        else:
            extracurricular.append("General Member of Student Body, Volunteer")
    

            
    # 3. Decision Logic - True Merit Score
    merit_score = (years_experience / 20 * 30) + (skill_score * 0.4) + (interview_score * 0.3)
    
    # Inject BIAS
    bias_score = np.zeros(n)
    for i in range(n):
        if gender[i] == 'Female':
            bias_score[i] -= 8 # Direct gender bias
        if location[i] == 'Rural':
            bias_score[i] -= 5 # Location bias
            
    final_score = merit_score + bias_score
    
    # Top 30% are selected based on the BIASED final score
    threshold = np.percentile(final_score, 70)
    selected = (final_score >= threshold).astype(int)
    
    df = pd.DataFrame({
        'candidate_id': [f"CAN{i:04d}" for i in range(1, n+1)],
        'name': names,
        'gender': gender,
        'location': location,
        'zipcode': zipcode,
        'education': education,
        'extracurricular_activities': extracurricular,
        'years_experience': np.round(years_experience, 1),
        'skill_score': np.round(skill_score, 1),
        'interview_score': np.round(interview_score, 1),
        'selected': selected
    })
    
    # Save the data
    output_path = os.path.join(os.path.dirname(__file__), 'synthetic_hiring_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {n} records with bias and saved to {output_path}")

    # Print some stats
    print("\nBias Stats (Selection Rate by Group):")
    print(df.groupby('gender')['selected'].mean())
    print(df.groupby('location')['selected'].mean())


if __name__ == "__main__":
    generate_biased_data()
