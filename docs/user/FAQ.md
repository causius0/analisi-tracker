# Analisi Tracker - Frequently Asked Questions

## General Questions

### What is Analisi Tracker?

Analisi Tracker is an advanced medical analytics platform that helps you track, analyze, and understand your laboratory test results over time. It uses machine learning and statistical analysis to provide insights into your health trends, detect anomalies, predict future values, and identify correlations between different tests.

### Is Analisi Tracker a medical device?

**No.** Analisi Tracker is a health information and analytics tool, not a medical device. It provides information and insights to help you and your healthcare providers make informed decisions, but it does not diagnose conditions or prescribe treatments. Always consult qualified healthcare professionals for medical advice.

### Who should use Analisi Tracker?

Analisi Tracker is designed for:
- **Individuals** tracking their own health metrics
- **Patients** managing chronic conditions (diabetes, kidney disease, etc.)
- **Caregivers** managing health data for family members
- **Healthcare providers** monitoring patient trends
- **Researchers** analyzing health data patterns
- **Fitness enthusiasts** optimizing their biomarkers

### What lab tests can I track?

You can track **any** laboratory test, including:
- Blood chemistry (glucose, cholesterol, etc.)
- Kidney function (creatinine, eGFR, BUN)
- Liver function (ALT, AST, GGT)
- Hormones (thyroid, testosterone, etc.)
- Complete blood count (CBC)
- Vitamins and minerals
- Cardiac markers
- Inflammation markers
- And thousands more

If it has a numeric value, you can track it!

---

## Account & Pricing

### How much does Analisi Tracker cost?

**Current Pricing:**
- **Free Plan**: $0/month - 1 patient, basic analytics, 10 PDFs/month
- **Premium Plan**: $9.99/month - 5 patients, full analytics, 100 PDFs/month
- **Enterprise Plan**: Contact sales - unlimited patients, API access, HIPAA compliance

**Free Trial**: 30-day free trial of Premium plan

### What payment methods do you accept?

- Credit/Debit Cards (Visa, Mastercard, American Express)
- PayPal
- Bank Transfer (Enterprise only)

### Can I change plans later?

Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be prorated or credited accordingly.

### Is there a free trial?

Yes! We offer a 30-day free trial of the Premium plan. No credit card required to start.

### Can I cancel my subscription?

Yes, you can cancel at any time. You'll continue to have access until the end of your billing period, after which your account will revert to the Free plan.

### What happens to my data if I cancel?

Your data is retained for:
- **Free Plan**: 1 year after last activity
- **Premium Plan**: 5 years after subscription ends
- **Enterprise Plan**: Available until account deletion

You can export your data at any time before deletion.

---

## Privacy & Security

### Is my health data secure?

**Yes.** We use industry-standard security measures:
- **Encryption**: AES-256 encryption for data at rest
- **Transmission**: TLS 1.3 for data in transit
- **Storage**: Encrypted cloud storage
- **Access**: Strict access controls and authentication
- **Auditing**: Complete activity logs
- **Compliance**: GDPR compliant, HIPAA compliant (Premium/Enterprise)

### Who can see my data?

**Only you** - unless you choose to share it. We:
- **Never sell** your data to third parties
- **Never share** data without your explicit consent
- **Never use** data for advertising
- Use data only to provide and improve our services

### Is Analisi Tracker HIPAA compliant?

Yes, our Premium and Enterprise plans are HIPAA compliant. We sign Business Associate Agreements (BAAs) with covered entities.

### Is my data used for research?

Only with your explicit consent. You may opt-in to participate in:
- **Anonymized research** (no identifying information)
- **Aggregated trend analysis** (population-level insights)
- **Feature improvement** (algorithm training)

You can opt-out at any time.

### Can I delete my data?

Yes, you can:
1. **Export** your data first (recommended)
2. **Request deletion** from Account Settings
3. **Confirm deletion** (permanent, cannot be undone)

Deletion takes 30 days to complete, during which you can restore your account if you change your mind.

---

## Getting Started

### How do I sign up?

1. Go to [analisi-tracker.example.com](https://analisi-tracker.example.com)
2. Click "Get Started Free"
3. Enter your email and password
4. Verify your email address
5. Add your first patient profile

That's it! You're ready to start tracking.

### What's the minimum number of data points needed?

- **Basic statistics**: 1 data point
- **Trend analysis**: 5 data points (minimum)
- **Reliable trends**: 10+ data points (recommended)
- **Correlations**: 8+ data points per test
- **Predictions**: 15+ data points (more = better)

### How often should I update my data?

As often as you have new lab results! Most users:
- Update after each blood test (monthly/quarterly)
- Upload PDFs when received from labs
- Add historical data going back 6-12 months

### Can I import historical data?

Yes! You can:
- **Upload PDFs** of past lab reports
- **Manually enter** historical values
- **Import CSV** with past data
- **Batch import** multiple records

Historical data improves trend analysis and predictions.

---

## Features & Usage

### How does PDF processing work?

1. **Upload PDF**: Select lab report PDF
2. **AI Analysis**: Our AI extracts lab tests, values, units
3. **OCR** (if needed): Converts scanned images to text
4. **Validation**: Checks extracted data for accuracy
5. **Review**: You review and correct any errors
6. **Import**: Data added to your profile

**Accuracy**: 85-98% depending on PDF quality

### Can I edit data after importing?

Yes! You can:
- Click any value to edit inline
- Update multiple records at once
- Correct typos and errors
- Add missing information
- Delete incorrect entries

All changes are tracked in the audit log.

### How accurate are the predictions?

Predictions are **estimates based on historical trends**.

**Factors affecting accuracy:**
- **Data quality**: Accurate, consistent data = better predictions
- **Data quantity**: More data points = more accurate
- **Timeframe**: Shorter predictions (30 days) more accurate than longer (90 days)
- **Stability**: Stable conditions = more accurate
- **Events**: Medications, illness, lifestyle changes affect accuracy

**Confidence levels**:
- **High**: 85%+ confidence in prediction
- **Medium**: 70-85% confidence
- **Low**: <70% confidence (use with caution)

Predictions should be used as guidance, not certainty. Always confirm with healthcare providers.

### What are correlations and why are they useful?

Correlations show relationships between different lab tests:
- **Positive correlation (+)**: Both increase together
- **Negative correlation (-)**: One increases when other decreases

**Examples:**
- Creatinine ↔ eGFR: -0.95 (strong negative - expected)
- Glucose ↔ HbA1c: +0.82 (strong positive - expected)

**Uses:**
- Understand disease mechanisms
- Identify related biomarkers
- Find compensatory relationships
- Discover early warning signs

**Note**: Correlation does not imply causation!

### How do I interpret trend strength?

| Strength | R² Score | Meaning |
|----------|----------|---------|
| Very Strong | 0.9-1.0 | Clear pattern, high confidence |
| Strong | 0.7-0.9 | Noticeable pattern |
| Moderate | 0.4-0.7 | Some pattern visible |
| Weak | 0.2-0.4 | Weak or no clear pattern |
| Very Weak | 0-0.2 | No meaningful pattern |

**Factors affecting strength:**
- **Data variability**: Consistent data = stronger trends
- **Time span**: Longer periods = clearer trends
- **Outliers**: Can weaken apparent trends
- **Sample size**: More data = more reliable

### What should I do if an anomaly is detected?

Anomalies are **unusual values that need attention**, but aren't necessarily errors.

**Steps:**
1. **Check the value**: Verify data entry is correct
2. **Look at context**: Recent illness, medications, lifestyle changes?
3. **Check severity**: Extreme/high severity = investigate
4. **Consult provider**: Share with healthcare provider
5. **Monitor**: Track subsequent values

**Common causes:**
- Actual health changes
- Lab error
- Data entry mistake
- Sample handling issues
- Temporary condition (illness, dehydration)

### Can I use Analisi Tracker for emergency diagnosis?

**No.** Analisi Tracker is **NOT for emergencies**.

**For medical emergencies, contact:**
- Emergency services (911 in US)
- Your healthcare provider
- Urgent care clinic
- Hospital emergency room

Analisi Tracker is for **ongoing health monitoring**, not acute care.

---

## Technical Questions

### What browsers are supported?

- **Chrome**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Opera**: 76+

**Mobile browsers**: iOS Safari 14+, Chrome Mobile

### Do I need to install anything?

**No.** Analisi Tracker is a web application that runs entirely in your browser. No downloads or installations required.

### Is there a mobile app?

**Not yet**, but our website is mobile-responsive and works great on smartphones and tablets. Native iOS and Android apps are in development.

### Can I use Analisi Tracker offline?

**Partially.** You can view cached data offline, but:
- Adding new data requires internet
- PDF processing requires internet
- Analytics calculations require internet
- Sync occurs when connection restored

### How much data can I store?

- **Free Plan**: Up to 10,000 data points
- **Premium Plan**: Up to 100,000 data points
- **Enterprise Plan**: Unlimited

Most users never reach these limits (typical usage: 500-2,000 data points per year).

### What's the maximum file size for PDFs?

10 MB per PDF. Most lab reports are 1-3 MB.

### How long does PDF processing take?

- **Digital PDFs**: 10-20 seconds
- **Scanned PDFs** (with OCR): 30-60 seconds
- **Large/complex PDFs**: Up to 2 minutes

Processing happens in the background, so you can continue using the app.

---

## Sharing & Collaboration

### Can I share my data with my doctor?

Yes! Several ways:
1. **Export PDF Report**: Professional format, email or print
2. **Secure Link**: Time-limited access, password protected
3. **CSV Export**: For their records
4. **Direct EHR Integration** (future)

### Can family members access my data?

Only if you grant them access:
1. Go to Patient Settings
2. Click "Share Profile"
3. Enter their email
4. Set permission level (Viewer/Editor)
5. Set expiration (optional)

You can revoke access at any time.

### Can I use Analisi Tracker for my children?

Yes! You can create patient profiles for dependents and manage their health data. Note that you must comply with applicable laws (e.g., COPPA in the US for children under 13).

---

## Troubleshooting

### "No data available" message

**Causes:**
- No data added yet
- Wrong patient selected
- Data outside date range

**Solutions:**
1. Add data using "+ Add Data" or "Upload PDF"
2. Check patient dropdown (top-right)
3. Adjust date range filters

### "Processing failed" error

**Causes:**
- Corrupted PDF file
- Password-protected PDF
- Unsupported file format
- File too large (>10 MB)

**Solutions:**
1. Try a different PDF file
2. Remove password protection
3. Ensure it's a valid PDF
4. Compress large files
5. Contact support if issue persists

### Trends seem incorrect

**Causes:**
- Insufficient data points (<5)
- Outliers affecting trend
- Incorrect dates
- Non-linear data

**Solutions:**
1. Add more data points
2. Check for and exclude outliers
3. Verify data dates are correct
4. Use non-parametric methods for non-linear data
5. Consider if trend is meaningful

### Predictions seem wrong

**Causes:**
- Low confidence (not enough data)
- Recent changes (medications, illness)
- Non-stationary data
- Using wrong forecast horizon

**Solutions:**
1. Check confidence level (high = more accurate)
2. Add more historical data
3. Exclude unusual periods (illness, medication changes)
4. Use shorter forecast horizon (30 vs 90 days)
5. Remember: predictions are estimates, not certainties

### Can't switch patients

**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Check you have permission to view patient
4. Log out and log back in
5. Contact support if issue persists

### PDF extraction has many errors

**Solutions:**
1. Use digital PDFs instead of scans (better quality)
2. Ensure scans are high-resolution (300 DPI)
3. Check for handwriting (OCR has limited support)
4. Try cropping to relevant sections only
5. Enter data manually for problematic PDFs

---

## Data Analysis Questions

### What's the difference between reference range and personalized range?

**Reference Range**: Population-based "normal" values
- Example: Glucose 70-100 mg/dL
- Based on healthy population
- May not be optimal for you

**Personalized Range**: Your individual normal
- Calculated from your historical data
- 95% confidence interval
- More relevant to your physiology

**Use both**: Reference range shows population context, personalized range shows what's normal for you.

### Why are my correlations different from literature?

Correlations are **individual-specific** and may differ from population averages because:
- **Sample size**: You have fewer data points
- **Time period**: Your specific timeframe
- **Individual variation**: Your unique physiology
- **Medications**: Affect relationships
- **Comorbidities**: Other conditions

Use correlations as **insights**, not definitive relationships.

### How do you calculate risk scores?

Risk scores consider:
1. **Current value**: How far from normal?
2. **Trend**: Improving or worsening?
3. **Variability**: Stable or fluctuating?
4. **Personal history**: Your baseline
5. **Reference ranges**: Population and personal

**Risk Levels:**
- **Very High** (75-100): Immediate attention needed
- **High** (50-75): Monitor closely
- **Medium** (25-50): Be aware
- **Low** (0-25): Normal expected

Risk scores are **estimates** and should be discussed with healthcare providers.

### What's the difference between p-value and confidence level?

**P-value** (hypothesis testing):
- Probability result is due to chance
- Lower = more significant
- Typically: <0.05 = significant

**Confidence level** (prediction):
- Probability prediction is correct
- Higher = more certain
- Typically: >85% = high confidence

Both indicate **statistical certainty** but for different things.

---

## Billing & Account

### How do I update my payment method?

1. Go to Account Settings
2. Click "Billing"
3. Click "Update Payment Method"
4. Enter new payment details
5. Save changes

### Can I get a refund?

We offer **pro-rated refunds** within 30 days of purchase if you're not satisfied. Contact support at billing@analisi-tracker.com.

### Do you offer discounts?

- **Annual plans**: Save 20% vs monthly
- **Students**: 50% off with valid .edu email
- **Healthcare providers**: Contact for enterprise pricing
- **Non-profits**: Special pricing available

### Can I change my email address?

Yes, go to Account Settings → Profile → Update Email. You'll need to verify the new email address.

### What happens if I forget my password?

Click "Forgot Password" on the login page, and we'll send a reset link to your email. The link expires in 24 hours.

---

## Integration & API

### Is there an API?

Yes, our **Enterprise plan** includes:
- RESTful API access
- API documentation
- Developer support
- Rate limits: 1000 requests/hour

### Can I integrate with EHR systems?

**Enterprise customers** can integrate with:
- Epic
- Cerner
- Allscripts
- athenahealth
- And more

Contact sales for information.

### Do you integrate with Apple Health or Google Fit?

**Not yet**, but it's on our roadmap for late 2026.

### Can I export data for research?

Yes! You can export anonymized data in CSV or JSON format. Ensure you have appropriate consent and follow ethical guidelines for research use.

---

## Support & Contact

### How do I get help?

**In-App Help:**
- Click "?" icon (top-right)
- Browse knowledge base
- Watch tutorials

**Contact Support:**
- Email: support@analisi-tracker.com
- Response time: Within 24 hours
- Premium: Priority support (within 4 hours)
- Enterprise: 24/7 phone support

**Live Chat:**
- Available 9am-5pm PST (Premium/Enterprise)

### How do I report a bug?

1. Go to Settings → Help → Report Bug
2. Describe the issue
3. Attach screenshot if possible
4. Include steps to reproduce
5. Submit

### How do I request a feature?

We love feedback! Share ideas at:
- Roadmap voting: analisi-tracker.example.com/roadmap
- Email: features@analisi-tracker.com
- Community forum: community.analisi-tracker.com

### Where can I find documentation?

- [User Guide](USER_GUIDE.md)
- [Quick Start](QUICK_START.md)
- [Features](FEATURES.md)
- [API Documentation](../api/API_REFERENCE.md)
- [Developer Guide](../developer/DEVELOPER_GUIDE.md)

---

## Legal & Compliance

### Is Analisi Tracker GDPR compliant?

Yes, we comply with GDPR for EU users:
- Right to access data
- Right to rectification
- Right to erasure
- Right to portability
- Right to object
- Data protection by design

### Is Analisi Tracker HIPAA compliant?

Yes, Premium and Enterprise plans are HIPAA compliant. We sign BAAs with covered entities and implement required safeguards.

### What are your Terms of Service?

See our [Terms of Service](../legal/TERMS_OF_SERVICE.md).

### What is your Privacy Policy?

See our [Privacy Policy](../legal/PRIVACY_POLICY.md).

### Can I use Analisi Tracker in my medical practice?

Yes! Healthcare providers can use Analisi Tracker to:
- Monitor patient trends
- Prepare for appointments
- Visualize treatment effects
- Educate patients

**Enterprise plan** includes:
- Multi-patient management
- HIPAA compliance
- Staff accounts
- EHR integration
- Priority support

---

## Miscellanous

### How often is Analisi Tracker updated?

We release updates **weekly** for bug fixes and small improvements, and **monthly** for major features. You'll automatically get all updates.

### Can I use Analisi Tracker offline for extended periods?

You can view cached data offline, but adding data, processing PDFs, and running analytics requires internet. Extended offline use is not recommended.

### Do you have a referral program?

Yes! Refer friends and earn:
- 1 month free for each referral
- Up to 12 months free per year
- Your referral gets 1 month free too

Find your referral link in Account Settings.

### Can I gift a subscription?

Yes! Go to Account Settings → Gift Subscription, enter recipient email, and purchase.

---

**Still have questions?**

Contact us at support@analisi-tracker.com or visit our community forum at community.analisi-tracker.com.

---

**Version**: 1.0.0
**Last Updated**: April 2026
