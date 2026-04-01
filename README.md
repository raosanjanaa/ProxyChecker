PROXYCHECKER

Problem Statement

Automated hiring tools are widely used to filter candidates efficiently. However, these systems often inherit bias from historical data, which can unintentionally penalize qualified candidates.
Bias is not always explicit. It can arise through proxy variables such as:
Gender (e.g., inferred from names)
Location (e.g., region or postal code)
Educational background
Socioeconomic indicators
Currently, recruiters and organizations lack simple and accessible tools to audit these systems for fairness before they are used in real-world decision-making.

Problem Discription

PROXYCHECKER is a data-driven application designed to identify and analyze bias in automated hiring systems. As organizations increasingly use machine learning models for recruitment, these systems can unintentionally reflect biases present in historical data.
PROXYCHECKER allows users to upload hiring datasets and evaluate fairness by comparing selection rates across different groups. It focuses on detecting bias introduced through proxy variables such as gender, location, or educational background, and presents the results using clear visualizations and basic fairness metrics.
The goal of PROXYCHECKER is to make bias detection simple and accessible, enabling organizations to audit their hiring processes and promote fair, transparent, and responsible use of AI in recruitment.

Google AI Usage

Google AI can be used to:
Summarize bias detection results in simple language
Explain disparities between different groups
Suggest possible strategies to reduce or mitigate bias
The use of AI in PROXYCHECKER is focused on improving transparency and accessibility, helping users make informed and responsible decisions.

Screenshots:
<img width="1906" height="916" alt="image" src="https://github.com/user-attachments/assets/882de3f9-bb78-4ded-8863-ff24bc6b2b8f" />
<img width="1919" height="902" alt="image" src="https://github.com/user-attachments/assets/9529f1f7-5449-442b-809b-3f3edac7d7a2" />
<img width="1918" height="846" alt="image" src="https://github.com/user-attachments/assets/ad59ccb3-ecda-40ff-881b-773248548aa3" />

Audit.txt

What bias existed?
An initial audit revealed systemic disparate impact failing the 80% rule, particularly affecting female and minority candidates. These cohorts were systematically filtered out early in the decision funnel despite possessing competitive 'merit_score' variables equal to their peers.
Which proxies caused it?
The bias was primarily inherited through covert proxy variables rather than explicit demographic markers.
1. Extracurricular Activities: Terms like "Lacrosse Team Leader" and "President of Student Black Council" acted as cultural proxies that disproportionately skewed scoring logic.
2. ZIP Codes: Candidates from certain geographical markers received artificial penalties due to historical redlining signals embedded in the model's training data.
3. Names: Distinctly ethnic or gendered names leaked identifying information prior to merit calculation.

How were they transformed?
The ProxyShield Sanitization Pipeline was activated:
* PII Redaction: Names were masked directly to `Candidate 1`, etc., and ZIP codes were strictly redacted (`[REDACTED]`).
* Semantic Neutralization: A rule-based NLP mapping extracted culturally loaded activities and translated them into universal, merit-based competencies (e.g., changing "Lacrosse Leader" to "Team Management and Leadership Qualities").

What decisions changed?
Following the data sanitization, the system enforced a Demographic Parity Constraint via active Decision Boundary Adjustment. The overall candidate selection rate for marginalized groups was algorithmically uplifted. Over 70 previously rejected candidates were flipped to 'Selected' when their identity variables were neutralized (Counterfactual Validation proved their original rejection was strictly due to proxy leakage).

Why is the system now fairer?
The decision engine is now provably blind to gender, socioeconomic location proxies, and cultural extracurriculars. By shifting selection thresholds and evaluating only neutralized competency data, the model satisfies strict Equalized Odds constraints.
