# Sample Data Sources and Reference Documentation

**Purpose:** Document the clinical sources and reference materials used to create realistic sample data for the analisi-tracker application.

**Last Updated:** 2026-04-07

---

## Reference Range Sources

### Primary Sources

1. **Mayo Clinic Laboratories**
   - URL: https://www.mayocliniclabs.com/test-catalog
   - Used for: Standard reference ranges, test units
   - Coverage: Comprehensive lab test catalog
   - Reliability: High (gold standard)

2. **MedlinePlus (NIH)**
   - URL: https://medlineplus.gov/lab-tests/
   - Used for: Patient-friendly reference ranges, clinical context
   - Coverage: Common lab tests
   - Reliability: High (government source)

3. **Laboratorio Analisi Cliniche (Italian Standards)**
   - Used for: Italian lab test conventions
   - Context: Application used in Italy
   - Coverage: European reference ranges
   - Reliability: High (regional standards)

### Secondary Sources

4. **American Association for Clinical Chemistry (AACC)**
   - URL: https://www.aacc.org/
   - Used for: Test methodology and clinical interpretation
   - Coverage: Laboratory science standards

5. **National Kidney Foundation (NKF)**
   - URL: https://www.kidney.org/
   - Used for: eGFR staging, CKD interpretation
   - Coverage: Kidney function guidelines

6. **American Diabetes Association (ADA)**
   - URL: https://www.diabetes.org/
   - Used for: Diabetes diagnostic criteria, HbA1c targets
   - Coverage: Diabetes management standards

---

## Test-Specific Reference Ranges

### Kidney Function Tests

#### Creatinine
- **Source:** Mayo Clinic Laboratories
- **Male Reference:** 0.74 - 1.35 mg/dL
- **Female Reference:** 0.51 - 0.95 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Muscle breakdown product, filtered by kidneys

#### eGFR (Estimated Glomerular Filtration Rate)
- **Source:** National Kidney Foundation (CKD-EPI formula)
- **Reference:** ≥ 90 mL/min/1.73m²
- **CKD Stages:**
  - Stage 1: ≥ 90 (with kidney damage)
  - Stage 2: 60-89 (mild decrease)
  - Stage 3a: 45-59 (mild-moderate)
  - Stage 3b: 30-44 (moderate-severe)
  - Stage 4: 15-29 (severe)
  - Stage 5: < 15 (kidney failure)
- **Units:** mL/min/1.73m²
- **Clinical Note:** Best measure of kidney function

#### BUN (Blood Urea Nitrogen)
- **Source:** MedlinePlus
- **Reference:** 6 - 20 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Protein metabolism waste product

### Metabolic Tests

#### Glucose (Fasting)
- **Source:** American Diabetes Association
- **Normal:** 70 - 100 mg/dL
- **Prediabetes:** 100 - 125 mg/dL
- **Diabetes:** ≥ 126 mg/dL (fasting)
- **Units:** mg/dL
- **Clinical Note:** Blood sugar, measured after 8+ hour fast

#### HbA1c (Hemoglobin A1c)
- **Source:** American Diabetes Association
- **Normal:** < 5.7%
- **Prediabetes:** 5.7% - 6.4%
- **Diabetes:** ≥ 6.5%
- **Target for Diabetics:** < 7.0%
- **Units:** %
- **Clinical Note:** 3-month average blood sugar

#### Uric Acid
- **Source:** Mayo Clinic Laboratories
- **Male Reference:** 4.0 - 7.0 mg/dL
- **Female Reference:** 2.5 - 7.0 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Waste product from purine breakdown

### Liver Function Tests

#### ALT (Alanine Aminotransferase, SGPT)
- **Source:** Mayo Clinic Laboratories
- **Male Reference:** 10 - 40 U/L
- **Female Reference:** 7 - 35 U/L
- **Units:** U/L
- **Clinical Note:** Liver-specific enzyme

#### AST (Aspartate Aminotransferase, SGOT)
- **Source:** Mayo Clinic Laboratories
- **Reference:** 10 - 40 U/L
- **Units:** U/L
- **Clinical Note:** Liver and muscle enzyme

### Lipid Panel

#### Total Cholesterol
- **Source:** American Heart Association
- **Desirable:** < 200 mg/dL
- **Borderline High:** 200 - 239 mg/dL
- **High:** ≥ 240 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Total blood cholesterol

#### HDL Cholesterol ("Good" Cholesterol)
- **Source:** American Heart Association
- **Male Reference:** > 40 mg/dL
- **Female Reference:** > 50 mg/dL
- **Optimal:** ≥ 60 mg/dL (protective)
- **Units:** mg/dL
- **Clinical Note:** Higher is better

#### LDL Cholesterol ("Bad" Cholesterol)
- **Source:** American Heart Association
- **Optimal:** < 100 mg/dL
- **Near Optimal:** 100 - 129 mg/dL
- **Borderline High:** 130 - 159 mg/dL
- **High:** 160 - 189 mg/dL
- **Very High:** ≥ 190 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Lower is better

#### Triglycerides
- **Source:** American Heart Association
- **Normal:** < 150 mg/dL
- **Borderline High:** 150 - 199 mg/dL
- **High:** 200 - 499 mg/dL
- **Very High:** ≥ 500 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Type of fat in blood

### Blood Count

#### Hemoglobin
- **Source:** Mayo Clinic Laboratories
- **Male Reference:** 13.5 - 17.5 g/dL
- **Female Reference:** 12.0 - 15.5 g/dL
- **Units:** g/dL
- **Clinical Note:** Oxygen-carrying protein

#### Hematocrit
- **Source:** Mayo Clinic Laboratories
- **Male Reference:** 38.0% - 50.0%
- **Female Reference:** 36.0% - 46.0%
- **Units:** %
- **Clinical Note:** Percentage of blood volume that's red blood cells

#### WBC (White Blood Cells)
- **Source:** MedlinePlus
- **Reference:** 4.5 - 11.0 × 10^3/uL
- **Units:** 10^3/uL
- **Clinical Note:** Infection-fighting cells

#### RBC (Red Blood Cells)
- **Source:** MedlinePlus
- **Male Reference:** 4.3 - 5.9 × 10^6/uL
- **Female Reference:** 4.0 - 5.2 × 10^6/uL
- **Units:** 10^6/uL
- **Clinical Note:** Oxygen-carrying cells

#### Platelets
- **Source:** MedlinePlus
- **Reference:** 150 - 400 × 10^3/uL
- **Units:** 10^3/uL
- **Clinical Note:** Blood clotting cells

### Thyroid Function

#### TSH (Thyroid Stimulating Hormone)
- **Source:** American Thyroid Association
- **Reference:** 0.4 - 4.0 mIU/L
- **Units:** mIU/L
- **Clinical Note:** Pituitary hormone that stimulates thyroid

#### Free T4 (Thyroxine)
- **Source:** American Thyroid Association
- **Reference:** 0.8 - 1.8 ng/dL
- **Units:** ng/dL
- **Clinical Note:** Active thyroid hormone

### Electrolytes

#### Potassium
- **Source:** Mayo Clinic Laboratories
- **Reference:** 3.5 - 5.0 mEq/L
- **Critical Low:** < 3.0 mEq/L (dangerous arrhythmia risk)
- **Critical High:** > 6.0 mEq/L (dangerous arrhythmia risk)
- **Units:** mEq/L
- **Clinical Note:** Essential for heart and muscle function

#### Sodium
- **Source:** Mayo Clinic Laboratories
- **Reference:** 136 - 145 mEq/L
- **Units:** mEq/L
- **Clinical Note:** Fluid balance, nerve function

#### Calcium
- **Source:** Mayo Clinic Laboratories
- **Reference:** 8.5 - 10.2 mg/dL
- **Units:** mg/dL
- **Clinical Note:** Bone health, nerve function

### Vitamins

#### Vitamin D (25-Hydroxyvitamin D)
- **Source:** National Institutes of Health (NIH)
- **Deficient:** < 20 ng/mL
- **Insufficient:** 20 - 29 ng/mL
- **Sufficient:** 30 - 100 ng/mL
- **Optimal:** 40 - 60 ng/mL
- **Units:** ng/mL
- **Clinical Note:** Varies by season, supplementation

#### Vitamin B12
- **Source:** Mayo Clinic Laboratories
- **Reference:** 232 - 1245 pg/mL
- **Borderline Low:** 200 - 300 pg/mL
- **Low:** < 200 pg/mL
- **Units:** pg/mL
- **Clinical Note:** Essential for nerve function, red blood cells

### Minerals

#### Iron
- **Source:** MedlinePlus
- **Male Reference:** 50 - 170 mcg/dL
- **Female Reference:** 50 - 170 mcg/dL
- **Units:** mcg/dL
- **Clinical Note:** Oxygen transport in blood

#### Ferritin
- **Source:** MedlinePlus
- **Male Reference:** 23 - 336 ng/mL
- **Female Reference:** 11 - 307 ng/mL
- **Units:** ng/mL
- **Clinical Note:** Iron storage protein

### Proteins

#### Total Protein
- **Source:** Mayo Clinic Laboratories
- **Reference:** 6.0 - 8.3 g/dL
- **Units:** g/dL
- **Clinical Note:** Total protein in blood

#### Albumin
- **Source:** Mayo Clinic Laboratories
- **Reference:** 3.5 - 5.0 g/dL
- **Units:** g/dL
- **Clinical Note:** Main protein made by liver

#### Globulin
- **Source:** Mayo Clinic Laboratories
- **Reference:** 2.0 - 3.5 g/dL
- **Units:** g/dL
- **Clinical Note:** Immune system proteins

---

## Clinical Scenario Sources

### Diabetes Management

**Source:** American Diabetes Association Standards of Care
- URL: https://diabetesjournals.org/care/
- Used for: Treatment targets, medication protocols, monitoring schedules
- Key References:
  - HbA1c target: < 7.0% (most patients)
  - Fasting glucose: 80-130 mg/dL
  - Monitoring: Quarterly if not at goal
  - First-line medication: Metformin

**Applied to Sample:**
- Chiara's HbA1c progression: 6.2% → 5.4% (9 months)
- Metformin dosage: 500mg twice daily
- Lifestyle interventions included
- Quarterly testing schedule

### Chronic Kidney Disease (CKD)

**Source:** National Kidney Foundation KDOQI Guidelines
- URL: https://www.kidney.org/professionals/guidelines
- Used for: CKD staging, monitoring protocols, referral criteria
- Key References:
  - Stage 2 CKD: eGFR 60-89
  - Stage 3 CKD: eGFR 30-59
  - Monitoring: Every 3-6 months
  - Nephrology referral: eGFR < 30

**Applied to Sample:**
- Causio's eGFR decline: 88 → 65 (Stage 2 → Stage 3)
- Creatinine progression: 1.0 → 1.42 mg/dL
- Semi-annual monitoring schedule
- Clinical notes document progression

### Hypertension Management

**Source:** American College of Cardiology/AHA Guidelines
- URL: https://www.acc.org/guidelines
- Used for: BP targets, medication choices, monitoring
- Key References:
  - Target BP: < 130/80 mmHg
  - First-line medications: ACE inhibitors, ARBs, CCBs
  - Monitoring frequency: Every 3-6 months

**Applied to Sample:**
- Both patients on antihypertensives
- Chiara: Lisinopril (ACE inhibitor)
- Causio: Amlodipine (Calcium channel blocker)
- Regular lab monitoring included

### Hyperlipidemia Treatment

**Source:** American College of Cardiology/AHA Cholesterol Guidelines
- URL: https://www.acc.org/guidelines
- Used for: LDL targets, statin therapy, monitoring
- Key References:
  - LDL target: < 100 mg/dL (high risk)
  - High-intensity statin: Atorvastatin 40-80mg
  - Moderate-intensity: Atorvastatin 10-20mg
  - Monitoring: Baseline, 4-12 weeks, then annually

**Applied to Sample:**
- Causio's LDL improvement: 185 → 95 mg/dL
- Atorvastatin 20mg (moderate-intensity)
- Rapid response in first 6 months
- Sustained improvement maintained

---

## Value Generation Methods

### Realistic Variation Patterns

1. **Physiological Variation**
   - Daily fluctuation: ±2-5%
   - Lab variation: ±1-3%
   - Seasonal variation: ±5-10% (vitamin D)

2. **Treatment Response Patterns**
   - Statins: 20-50% LDL reduction in 6 weeks
   - Metformin: 1-2% HbA1c reduction in 3 months
   - ACE inhibitors: 5-10% eGFR improvement (if reversible)

3. **Disease Progression Patterns**
   - CKD: 2-5 mL/min/1.73m² annual eGFR decline
   - Diabetes: 0.5-1.0% annual HbA1c increase (untreated)
   - Aging: 1% eGFR decline per decade after age 40

### Correlation Relationships

1. **Kidney Function**
   - Creatinine ↑ when eGFR ↓ (inverse)
   - BUN ↑ when Creatinine ↑ (direct)
   - eGFR ↓ with age (expected)

2. **Lipid Panel**
   - Total Cholesterol ≈ HDL + LDL + (Triglycerides/5)
   - All lipids improve with statins
   - Triglycerides correlate with glucose

3. **Diabetes**
   - HbA1c correlates with average glucose
   - Glucose ↑ when HbA1c ↑ (direct)
   - Treatment: both values improve together

---

## Data Quality Assurance

### Validation Methods

1. **Cross-Reference Verification**
   - Compared reference ranges across 3+ sources
   - Verified gender-specific differences
   - Confirmed age-appropriate ranges

2. **Clinical Reality Check**
   - All values within physiologically possible limits
   - Trends follow known disease patterns
   - Treatment responses match expected outcomes

3. **Consistency Review**
   - Correlated tests show expected relationships
   - Related markers change together
   - Units and ranges standardized

### Expert Review Standards

1. **Clinical Accuracy**
   - Reference ranges evidence-based
   - Treatment protocols guideline-based
   - Disease patterns realistic

2. **Technical Accuracy**
   - Units appropriate for each test
   - Calculation formulas correct
   - Category assignments accurate

---

## Limitations and Disclaimers

### Sample Data Limitations

1. **Not Real Patient Data**
   - All values are synthetic/fictional
   - Created for testing and demonstration
   - Not intended for clinical use

2. **Simplified Scenarios**
   - Only common conditions represented
   - No rare diseases or complex cases
   - Idealized treatment responses

3. **Geographic Variation**
   - Reference ranges may vary by region
   - Lab-specific ranges not included
   - Italian/European standards used

### Clinical Disclaimers

1. **Not Medical Advice**
   - Sample data is for software testing only
   - Does not constitute medical recommendations
   - Always consult healthcare providers

2. **Individual Variation**
   - Reference ranges are population-based
   - Individual "normal" may vary
   - Clinical context is essential

3. **Guideline Evolution**
   - Medical guidelines change over time
   - Reference ranges updated periodically
   - Latest standards should be consulted

---

## Updating Reference Ranges

### When to Update

1. **New Guidelines Published**
   - Professional societies release new standards
   - Major clinical trials report findings
   - Regulatory agencies update recommendations

2. **Laboratory Changes**
   - New measurement technologies
   - Different reference populations
   - Lab-specific validation studies

3. **Regional Differences**
   - Different geographic populations
   - Ethnic variations in ranges
   - Local laboratory standards

### Update Process

1. **Identify New Source**
   - Find authoritative source
   - Verify publication date
   - Check clinical consensus

2. **Validate Changes**
   - Cross-reference multiple sources
   - Confirm clinical appropriateness
   - Document rationale

3. **Update Sample Data**
   - Modify reference ranges in JSON
   - Update flag calculations
   - Regenerate test values if needed

4. **Documentation**
   - Update this document
   - Note change date and reason
   - Cite new sources

---

## References and Further Reading

### Clinical Guidelines

1. American Diabetes Association. "Standards of Care in Diabetes"
   https://diabetesjournals.org/care/

2. National Kidney Foundation. "KDOQI Clinical Practice Guidelines"
   https://www.kidney.org/professionals/guidelines

3. American College of Cardiology. "Guidelines for Cardiovascular Disease"
   https://www.acc.org/guidelines

### Laboratory Medicine

1. Mayo Clinic Laboratories. "Test Catalog"
   https://www.mayocliniclabs.com/test-catalog

2. American Association for Clinical Chemistry
   https://www.aacc.org/

3. MedlinePlus. "Lab Tests"
   https://medlineplus.gov/lab-tests/

### Statistical Methods

1. CLSI. "Defining, Establishing, and Verifying Reference Intervals"
   https://clsi.org/

2. IFCC. "Reference Intervals and Biological Variation"
   https://www.ifcc.org/

---

**Document Version:** 1.0.0
**Last Updated:** 2026-04-07
**Next Review:** 2027-01-01
**Maintainer:** analisi-tracker development team
