import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import warnings

# Suppress sklearn warnings for clean terminal output
warnings.filterwarnings('ignore')

class DataUnderstandingEngine:
    def __init__(self, df: pd.DataFrame, target_column: str = 'selected'):
        self.df = df.copy()
        self.target_column = target_column
        self.numerical_cols = []
        self.categorical_cols = []
        self.sensitive_cols_potential = ['gender', 'race', 'ethnicity', 'age', 'location', 'religion']
        self.detected_sensitive_cols = []

    def analyze(self):
        # Auto-detect column types
        for col in self.df.columns:
            if col == self.target_column or col == 'candidate_id':
                continue
            if pd.api.types.is_numeric_dtype(self.df[col]):
                if self.df[col].nunique() < 10:
                    self.categorical_cols.append(col)
                else:
                    self.numerical_cols.append(col)
            else:
                self.categorical_cols.append(col)
                
        # Detect sensitive columns (naive keyword matching for now)
        for col in self.categorical_cols + self.numerical_cols:
            if any(sens in col.lower() for sens in self.sensitive_cols_potential):
                self.detected_sensitive_cols.append(col)
                
        # Handle Missing Values strategy
        missing_stats = self.df.isnull().sum().to_dict()
        
        return {
            "num_rows": len(self.df),
            "num_cols": len(self.df.columns),
            "target": self.target_column,
            "categorical": self.categorical_cols,
            "numerical": self.numerical_cols,
            "sensitive_detected": self.detected_sensitive_cols,
            "missing_values": {k: v for k, v in missing_stats.items() if v > 0}
        }

class BiasLocalizationEngine:
    def __init__(self, df: pd.DataFrame, target_col: str, sensitive_cols: list):
        self.df = df.copy()
        self.target_col = target_col
        self.sensitive_cols = sensitive_cols

    def calculate_disparate_impact(self):
        """Measures Disparate Impact Ratio per sensitive group."""
        metrics = []
        overall_selection_rate = self.df[self.target_col].mean()
        
        for col in self.sensitive_cols:
            groups = self.df.groupby(col)[self.target_col].agg(['mean', 'count']).reset_index()
            groups.rename(columns={'mean': 'selection_rate'}, inplace=True)
            
            # Find the privileged group (highest selection rate)
            max_rate = groups['selection_rate'].max()
            if max_rate > 0:
                groups['disparate_impact'] = groups['selection_rate'] / max_rate
            else:
                groups['disparate_impact'] = 0.0
                
            for _, row in groups.iterrows():
                metrics.append({
                    "feature": col,
                    "group": row[col],
                    "count": int(row['count']),
                    "selection_rate": float(row['selection_rate']),
                    "disparate_impact": float(row['disparate_impact']),
                    "biased_against": bool(row['disparate_impact'] < 0.8) # 80% rule
                })
        return metrics

    def correlate_with_outcome(self):
        """Calculates point-biserial / Cramer's V approximations to find proxy variables."""
        # For simplicity, calculate Pearson correlation of numeric proxies and one-hot categorical proxies
        # Since this is a specialized auditing tool, we compute mutual information or simple absolute correlation
        numeric_df = pd.get_dummies(self.df.drop(columns=['candidate_id', self.target_col], errors='ignore'))
        correlations = numeric_df.corrwith(self.df[self.target_col]).abs().sort_values(ascending=False)
        
        top_correlations = []
        for feat, corr in correlations.items():
            # If the feature is derived from a sensitive col, flag it
            is_sensitive = any(scol in feat for scol in self.sensitive_cols)
            top_correlations.append({
                "feature": feat,
                "correlation": float(corr),
                "is_sensitive": is_sensitive
            })
        return top_correlations[:10]

class BiasCorrectionEngine:
    def __init__(self, df: pd.DataFrame, target_col: str, sensitive_cols: list, categorical_cols: list, numerical_cols: list):
        self.df = df.copy()
        self.target_col = target_col
        self.sensitive_cols = sensitive_cols
        self.categorical_cols = categorical_cols
        self.numerical_cols = numerical_cols
        self.model = None
        self.preprocessor = None
        self.original_predictions = None

    def train_baseline_model(self):
        X = self.df[self.categorical_cols + self.numerical_cols]
        y = self.df[self.target_col]
        
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))])

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numerical_cols),
                ('cat', categorical_transformer, self.categorical_cols)])

        self.model = Pipeline(steps=[('preprocessor', self.preprocessor),
                                     ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced'))])
        
        self.model.fit(X, y)
        self.original_predictions = self.model.predict(X)
        self.original_probas = self.model.predict_proba(X)[:, 1]

    def apply_fairness_constraints(self, strategy="demographic_parity"):
        """
        Actively fixes bias. We implement a custom prediction threshold shifting (Decision Boundary Adjustment)
        to satisfy demographic parity on the training data.
        """
        # Ensure we have a baseline model
        if self.model is None:
            self.train_baseline_model()

        probas = self.original_probas.copy()
        corrected_predictions = self.original_predictions.copy()
        
        # We find a specific threshold per sensitive group to ensure equal selection rates
        # Let's say we want a global selection rate of ~30%
        target_selection_rate = 0.30
        
        adjustments = []
        
        # If we have multiple sensitive columns, for simplicity, we focus on the first one that showed bias
        focus_col = self.sensitive_cols[0] 
        
        group_thresholds = {}
        for group in self.df[focus_col].unique():
            group_mask = self.df[focus_col] == group
            group_probas = probas[group_mask]
            
            if len(group_probas) == 0:
                continue
                
            # Find threshold that gives target_selection_rate
            # Sort descending
            sorted_probas = np.sort(group_probas)[::-1]
            idx = int(len(sorted_probas) * target_selection_rate)
            if idx >= len(sorted_probas):
                idx = len(sorted_probas) - 1
            threshold = sorted_probas[idx] if idx >= 0 else 0.5
            
            group_thresholds[group] = threshold
            corrected_predictions[group_mask] = (group_probas >= threshold).astype(int)
            
            adjustments.append({
                "group": group,
                "strategy": "Threshold Shifting",
                "original_threshold": 0.5,
                "new_threshold": float(threshold)
            })

        return group_thresholds, corrected_predictions, adjustments

    def apply_textual_neutralization(self):
        """Replaces biased proxy text with neutral, skill-based competencies and masks PII."""
        corrected_text_df = self.df.copy()
        
        if 'name' in corrected_text_df.columns:
            # We want deterministic ID mapping
            corrected_text_df['name'] = [f"Candidate {i+1}" for i in range(len(corrected_text_df))]
            
        if 'zipcode' in corrected_text_df.columns:
            corrected_text_df['zipcode'] = "[REDACTED]"
            
        text_replacements = {
            "Lacrosse Team Leader": "Team Management and Leadership Qualities",
            "President of Student Black Council": "President of Student Advocacy Group",
            "Volleyball Captain": "Team Leadership and Strategy Coordination"
        }
        
        text_deltas = []
        
        if 'extracurricular_activities' in corrected_text_df.columns:
            for idx, row in corrected_text_df.iterrows():
                original_text = str(row['extracurricular_activities'])
                new_text = original_text
                
                changed = False
                for proxy, neutral in text_replacements.items():
                    if proxy in original_text:
                        new_text = new_text.replace(proxy, neutral)
                        changed = True
                
                if changed:
                    corrected_text_df.at[idx, 'extracurricular_activities'] = new_text
                    
                    found_proxies = [p for p in text_replacements.keys() if p in original_text]
                    if found_proxies:
                        text_deltas.append({
                            "candidate_id": str(row.get('candidate_id', f"CAN-{idx}")),
                            "original_term": found_proxies[0],
                            "neutralized_term": text_replacements[found_proxies[0]],
                            "full_original": original_text,
                            "full_neutralized": new_text
                        })
                    
        return corrected_text_df, text_deltas

class CounterfactualValidator:
    def __init__(self, df: pd.DataFrame, model_pipeline, target_col: str, sensitive_cols: list):
        self.df = df.copy()
        self.model_pipeline = model_pipeline
        self.target_col = target_col
        self.sensitive_cols = sensitive_cols
        
    def validate(self):
        """
        Flips sensitive attributes to see if the original model's decision changes.
        """
        X = self.df.drop(columns=['candidate_id', self.target_col], errors='ignore')
        original_preds = self.model_pipeline.predict(X)
        
        # Find individuals where flipping the sensitive trait flips the decision
        # We'll just take the first sensitive col and swap to another value
        focus_col = self.sensitive_cols[0]
        unique_vals = self.df[focus_col].unique()
        
        flipped_cases = []
        
        for i, row in X.iterrows():
            current_val = row[focus_col]
            # Try other values
            for other_val in unique_vals:
                if current_val != other_val:
                    temp_row = pd.DataFrame([row])
                    temp_row[focus_col] = other_val
                    flipped_pred = self.model_pipeline.predict(temp_row)[0]
                    
                    if flipped_pred != original_preds[i]:
                        flipped_cases.append({
                            "row_index": i,
                            "original_val": current_val,
                            "flipped_val": other_val,
                            "original_pred": int(original_preds[i]),
                            "flipped_pred": int(flipped_pred)
                        })
                        break # Found a counterfactual, move to next person
                        
        return flipped_cases
