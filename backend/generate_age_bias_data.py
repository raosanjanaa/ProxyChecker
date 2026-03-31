import pandas as pd
import numpy as np
import random
import os

def generate_age_bias_data(n=800):
    np.random.seed(1337)
    random.seed(1337)
    
    # Core Merit
    years_experience = np.random.normal(12, 8, n).clip(1, 40)
    skill_score = np.random.normal(75, 12, n).clip(0, 100)
    
    # Protected Attribute
    # Let's say Older candidates are > 50, Younger are <= 50
    # We won't explicitly train on "Age", but we will record it.
    age = [int(22 + exp + random.randint(0, 5)) for exp in years_experience]
    
    # Proxies for Age
    graduation_year = [2026 - (a - 22) for a in age]
    
    email_domains = []
    tech_stacks = []
    communication_style = []
    
    for a in age:
        if a > 45: # Older demographic proxy traits
            email_domains.append(random.choice(['@aol.com', '@yahoo.com', '@hotmail.com']))
            tech_stacks.append(random.choice(['Fortran, COBOL, OracleDB', 'C++, MFC, VisualBasic', 'Java 8, SOAP, Subversion']))
            communication_style.append(random.choice(['Phone Preference', 'Formal Lettering']))
        else: # Younger demographic proxy traits
            email_domains.append(random.choice(['@gmail.com', '@icloud.com']))
            tech_stacks.append(random.choice(['React, Node.js, Vercel', 'Rust, WebAssembly, GraphQL', 'Python, Docker, Kubernetes']))
            communication_style.append(random.choice(['Slack Preference', 'Async Texting']))
            
    # Names to make it realistic
    first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Isabella", "Elijah", "Sophia", "William", "Barbara", "Richard", "Susan", "Joseph", "Margaret", "Charles"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"]
    
    candidate_ids = [f"CAN-AGE-{i+1000}" for i in range(n)]
    
    # Calculate True Merit (Blind to age)
    # Both older and younger candidates have a baseline equal distribution of raw skill 
    # (Older actually have more experience)
    merit_score = (np.array(years_experience) / 40 * 40) + (np.array(skill_score) * 0.6)
    
    # Add Systemic Bias against Older Proxies
    # If a resume has older proxies, the human grader historically gave them a lower "cultural fit" score
    cultural_fit_score = []
    for stack in tech_stacks:
        if 'Fortran' in stack or 'MFC' in stack or 'SOAP' in stack:
            # Heavily penalized for "outdated" proxies even if highly skilled
            cultural_fit_score.append(random.randint(20, 50))
        else:
            cultural_fit_score.append(random.randint(60, 95))
            
    # Final Biased Outcome Generation
    final_score = merit_score * 0.6 + np.array(cultural_fit_score) * 0.4
    threshold = np.percentile(final_score, 70) # Top 30% are hired
    
    selected = [1 if score >= threshold else 0 for score in final_score]
    
    df = pd.DataFrame({
        "candidate_id": candidate_ids,
        "name": [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(n)],
        "age": age, # Protected Class
        "years_experience": [int(x) for x in years_experience],
        "graduation_year": graduation_year, # Proxy 1
        "email_domain": email_domains, # Proxy 2
        "tech_stack": tech_stacks, # Proxy 3
        "communication_style": communication_style,
        "skill_assessment": [round(x, 1) for x in skill_score],
        "cultural_fit": cultural_fit_score,
        "selected": selected
    })
    
    return df

if __name__ == "__main__":
    df = generate_age_bias_data(800)
    output_path = os.path.join(os.path.dirname(__file__), "..", "synthetic_age_bias_data.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated Age-Biased Dataset with 800 records at: {output_path}")
    
    older_hired = df[(df.age > 45) & (df.selected == 1)].shape[0] / df[df.age > 45].shape[0] if df[df.age > 45].shape[0] > 0 else 0
    young_hired = df[(df.age <= 45) & (df.selected == 1)].shape[0] / df[df.age <= 45].shape[0] if df[df.age <= 45].shape[0] > 0 else 0
    print(f"Older Selection Rate: {older_hired:.1%}")
    print(f"Younger Selection Rate: {young_hired:.1%}")
