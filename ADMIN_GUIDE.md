# Compliance Officer Admin Guide
## Australian National Bullion - AML/CTF Compliance Platform

**Version:** 2.0  
**Last Updated:** January 2026  
**For:** Compliance Officers, AML/CTF Staff

---

## Table of Contents
1. [Introduction & Regulatory Context](#1-introduction--regulatory-context)
2. [Getting Started](#2-getting-started)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Document Verification](#4-document-verification)
5. [Transaction Reviews](#5-transaction-reviews)
6. [EDD Investigations](#6-edd-investigations-enhanced-due-diligence)
7. [EDD Reviews](#7-edd-reviews)
8. [TTR Reports](#8-ttr-reports-threshold-transaction-reports)
9. [Suspicious Reports (SMR)](#9-suspicious-reports-smr)
10. [Staff Training](#10-staff-training)
11. [Reports & Analytics](#11-reports--analytics)
12. [Audit Logs](#12-audit-logs)
13. [Quick Reference](#13-quick-reference)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Introduction & Regulatory Context

### Purpose
This platform manages Australian National Bullion's compliance with:
- **AML/CTF Act 2006** (Anti-Money Laundering and Counter-Terrorism Financing)
- **AML/CTF Rules 2007**
- **AUSTRAC Reporting Requirements**

### Key Thresholds
| Threshold | Requirement | Deadline |
|-----------|-------------|----------|
| **$5,000 AUD** | KYC Verification Required | Before transaction completion |
| **$10,000 AUD** | TTR (Threshold Transaction Report) | Within 10 business days |
| **$50,000 AUD** | Enhanced Due Diligence (EDD) | Before transaction approval |
| **Any amount** | SMR if suspicious | Within 3 business days of forming suspicion |

### Your Responsibilities
As a Compliance Officer, you are responsible for:
- Reviewing and approving customer identity documents
- Investigating flagged transactions
- Managing EDD investigations for high-risk customers
- Ensuring timely submission of TTRs and SMRs to AUSTRAC
- Maintaining staff training compliance
- Generating compliance reports

---

## 2. Getting Started

### Accessing the Admin Portal
1. Navigate to `/admin` or click "Admin" in the header navigation
2. You must be logged in with a Clerk account that has admin privileges
3. The dashboard loads automatically with live statistics

### Navigation
- **Breadcrumbs**: Located at the top of each page for easy navigation
- **Quick Links**: Dashboard provides shortcuts to all major functions
- **Side Navigation**: Use the admin layout's quick nav in the header

### User Roles
| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all functions including staff management |
| **Manager** | Can approve high-risk EDD decisions, management sign-off |
| **Compliance Officer** | Standard review functions, cannot approve high-risk rejections |

---

## 3. Dashboard Overview

**Route:** `/admin`

The dashboard is your home base. It refreshes automatically when you return to the tab.

### Action Required Section
These cards show items needing immediate attention. **Click any card to go directly to that section.**

| Card | What It Shows | Priority |
|------|---------------|----------|
| 📄 **Document Verifications** | Pending KYC documents | High - blocks customer transactions |
| 🚩 **Flagged Transactions** | System-flagged transactions | High - potential compliance risk |
| 🔬 **Active EDD Investigations** | Open EDD cases | Medium - ongoing work |
| 📊 **Pending TTRs** | Transactions ≥$10k not yet reported | **Critical** - legal deadline |
| ⚠️ **Suspicious Reports** | SMRs awaiting action | **Critical** - 3-day deadline |
| 📋 **EDD Reviews** | Customer EDD submissions to review | Medium |

### Training Compliance Alert
If any staff have overdue AML/CTF training, a red "Overdue Training" card appears. This is a compliance requirement.

### Statistics Section
Quick snapshot of platform health:
- Total/verified customers
- Transaction volumes (last 30 days)
- Verification rates
- Training compliance status

---

## 4. Document Verification

**Route:** `/admin/document-verification`

### Purpose
Review customer-uploaded identity documents for KYC compliance per AUSTRAC Section 6.1.

### Document Categories
| Category | Examples | Required For |
|----------|----------|--------------|
| **Primary Photo ID** | Passport, Driver's License, Proof of Age Card | All customers |
| **Primary Non-Photo** | Birth Certificate, Citizenship Certificate | Alternative verification |
| **Secondary** | Medicare Card, Bank Statement, Utility Bill | Supporting documentation |

### Review Process

#### Step 1: View Pending Documents
- Default view shows "Pending" documents only
- Click "All Documents" to see historical reviews

#### Step 2: Click "Review" to Expand
Document details appear including:
- Customer name and email
- Document type and category
- File details (size, upload date)
- **Certification status** (blue badge = certified, red = not certified)

#### Step 3: View the Document Image
- Image loads automatically when you expand
- Examine for:
  - Clarity and legibility
  - Document validity (not expired)
  - Name matches customer account
  - **For certified documents**: Check certification elements

#### Step 4: For Certified Documents - IMPORTANT
Certified documents have extra requirements. You MUST verify:

**Certification Checklist:**
- [ ] Certifier's signature is present
- [ ] Certifier's printed name is visible
- [ ] Certifier's qualification/title is stated
- [ ] Registration number (if applicable) is included
- [ ] Certification date is within last 12 months
- [ ] Statement "This is a true copy of the original" or similar
- [ ] Document has been sighted by certifier (not a copy of a copy)

> ⚠️ **IMPORTANT:** Check the "I have verified all certification requirements" box BEFORE approving. The system will warn you if you try to approve without checking this.

#### Step 5: Make Your Decision

**Approve** if:
- Document is clear and readable
- Not expired
- Name matches customer account
- Certification requirements met (if certified)

**Reject** if:
- Document is unclear or poor quality
- Document has expired
- Wrong document type submitted
- Certification is missing or invalid
- Suspected fraudulent document

#### Step 6: Add Review Notes
- **Required** for both approval and rejection
- Be specific: "Passport verified, expires 2028, certification by JP #12345 dated 15/01/2026"
- For rejections, also select a **Rejection Reason** from the dropdown

### Common Rejection Reasons
| Reason | When to Use |
|--------|-------------|
| Not Certified (AUSTRAC 6.1) | Manual upload without proper certification |
| Invalid Certification | Certification incomplete or doesn't meet requirements |
| Poor Quality / Unreadable | Cannot verify document details |
| Expired | Document past expiry date |
| Wrong Type | Customer submitted incorrect document category |
| Suspected Fraudulent | Signs of tampering or forgery |

---

## 5. Transaction Reviews

**Route:** `/admin/reviews`

### Purpose
Investigate transactions flagged by the system for risk indicators.

### Why Transactions Get Flagged
- **High Value**: Transactions ≥$10,000 (TTR threshold)
- **Velocity**: Multiple transactions in short period
- **Pattern**: Unusual purchasing patterns
- **Customer Risk**: High-risk customer profile
- **Structuring Suspicion**: Amounts just below thresholds

### Transaction Card Information
Each flagged transaction shows:
- Customer name and email
- Transaction amount (in AUD and original currency if different)
- Date of transaction
- Risk indicators (badges):
  - **TTR Required** (purple) - ≥$10,000
  - **KYC Required** (blue) - ≥$5,000

### Review Process

#### Step 1: Examine Transaction Details
Click "Show Details" to see:
- Full customer name
- Verification status
- Customer risk level
- Product purchased
- Transaction and customer IDs

#### Step 2: Consider the Context
Ask yourself:
- Is this consistent with the customer's profile?
- Does the customer have proper verification?
- Are there multiple recent transactions?
- Does this appear to be structuring?

#### Step 3: Document Your Review
**Required:** Enter review notes explaining your decision rationale.

#### Step 4: Make Your Decision

**Approve** if:
- Transaction appears legitimate
- Customer has appropriate verification
- No red flags identified
- Consistent with customer profile

**Reject** if:
- Customer verification is insufficient
- Clear signs of structuring or suspicious activity
- Unable to verify legitimacy

#### Step 5: Trigger EDD (When Warranted)
If the transaction raises concerns but you need more information:

1. Click "▶ Trigger EDD Investigation"
2. Enter a clear reason (e.g., "Unusual transaction pattern - 3 large purchases in 24 hours, customer recently verified")
3. Click "Create EDD Investigation & Block Customer"

> ⚠️ **NOTE:** Triggering EDD will **block the customer** from further transactions until the investigation is resolved.

---

## 6. EDD Investigations (Enhanced Due Diligence)

**Route:** `/admin/edd-investigations`

### Purpose
Conduct in-depth investigations for high-risk customers or suspicious patterns. Required for:
- Transactions ≥$50,000
- PEP (Politically Exposed Persons)
- Customers from high-risk jurisdictions
- Manually triggered from transaction reviews

### Investigation Statuses
| Status | Meaning |
|--------|---------|
| **Open** | New investigation, work to begin |
| **Awaiting Customer Info** | Information requested from customer |
| **Under Review** | Actively being investigated |
| **Escalated** | Requires management attention |
| **Completed - Approved** | Customer cleared, standard monitoring |
| **Completed - Rejected** | Relationship terminated |
| **Completed - Ongoing Monitoring** | Approved with enhanced surveillance |

### Filter by Status
Use the filter buttons to view:
- **Active**: All open investigations
- **Completed**: Historical/closed cases
- **All**: Everything

### Investigation Workflow

#### Tab 1: Checklist
Complete each section systematically:

**Customer Information Review**
- Verify all customer details are accurate
- Check verification status and history
- Review any previous investigations

**Employment Verification**
- Confirm occupation and employer
- Assess if income supports transaction levels
- Flag any inconsistencies

**Source of Wealth**
- Where did the customer's overall wealth come from?
- Inheritance, employment, business ownership, investments?
- Request documentation if not provided

**Source of Funds**
- Where specifically is the money for THIS transaction coming from?
- Bank statements to verify
- Ensure alignment with declared source

**Transaction Pattern Analysis**
- Compare to similar customers
- Identify any unusual patterns
- Document your analysis

**Additional Information**
- Track any extra documents or information gathered
- Note any outstanding items

#### Saving Checklist Progress
After completing a section:
1. Enter findings in the text fields
2. Check the "Verified" checkbox
3. Click "Save Section"

#### Tab 2: Timeline & Requests
Use this tab to:
- **Request Information**: Ask customer for specific documents
  - Enter items (comma-separated)
  - Set a deadline if needed
  - Customer will be notified
- **Escalate**: If case requires senior review
- View history of all actions taken

#### Tab 3: Complete Investigation
When all checks are done:

1. **Investigation Findings**: Summarize what you found
2. **Risk Assessment**: Your overall risk evaluation
3. **Compliance Recommendation**: Choose one:
   - **Approve Relationship**: Standard monitoring going forward
   - **Ongoing Monitoring**: Approve but keep on watchlist
   - **Enhanced Monitoring**: Approve with close surveillance
   - **Reject Relationship**: Do not proceed (requires management approval)
   - **Escalate to SMR**: Suspicious activity identified

### Management Approval
For high-risk decisions (reject, escalate to SMR), management approval is required:
- A manager must click "Grant Management Approval"
- The investigation cannot be fully closed without this

---

## 7. EDD Reviews

**Route:** `/admin/edd-reviews`

### Purpose
Review customer-submitted EDD forms. Different from EDD Investigations - these are forms the customer fills out themselves, typically triggered automatically for transactions ≥$50,000.

### What Customers Provide
| Field | Description |
|-------|-------------|
| Source of Wealth | How they accumulated their wealth |
| Transaction Purpose | Why they're making this purchase |
| Expected Frequency | How often they plan to transact |
| Expected Annual Volume | Anticipated yearly spend |
| PEP Status | If they're a Politically Exposed Person |

### Review Process

#### Step 1: Filter by Status
- **Pending**: New submissions to review
- **Under Review**: In progress
- **Escalated**: Needs management decision
- **Approved/Rejected**: Completed

#### Step 2: Expand the Record
Click on a submission to see full details.

#### Step 3: Evaluate the Submission
Consider:
- Does the source of wealth make sense for this customer?
- Is the transaction purpose legitimate?
- Is the expected volume consistent with their profile?
- If PEP, are there additional risk factors?

#### Step 4: Take Action
| Action | When to Use |
|--------|-------------|
| **Approve** | Information is satisfactory and consistent |
| **Request Info** | Need clarification or additional details |
| **Escalate** | Requires management review (high-risk factors) |
| **Reject** | Information is unsatisfactory or suspicious |

> **Note:** Rejecting an EDD review may require management approval if the customer is high-risk.

---

## 8. TTR Reports (Threshold Transaction Reports)

**Route:** `/admin/ttr-reports`

### Purpose
Report cash/bullion transactions of **$10,000 AUD or more** to AUSTRAC.

### ⚠️ LEGAL DEADLINE
TTRs must be submitted to AUSTRAC within **10 business days** of the transaction.

### What You'll See
A table of all transactions meeting the TTR threshold that haven't been marked as submitted.

Each record shows:
- Internal reference number
- Customer name
- Transaction amount
- Transaction date
- Days since transaction (watch for approaching deadlines!)

### Workflow

#### Step 1: Export CSV
1. Click "Export CSV" to download the report
2. File is named `TTR_Report_YYYY-MM-DD.csv`
3. Format matches AUSTRAC Online requirements

#### Step 2: Submit to AUSTRAC
1. Log into AUSTRAC Online portal
2. Upload the CSV file OR manually enter records
3. Note any reference numbers provided by AUSTRAC

#### Step 3: Mark as Submitted
1. Back in the admin portal, select the records you submitted (checkbox)
2. Click "Mark as Submitted"
3. Confirm the action
4. Records will be removed from the pending list

### Best Practice
- Review pending TTRs **daily**
- Submit to AUSTRAC within 5 business days (buffer before deadline)
- Keep AUSTRAC reference numbers on file

---

## 9. Suspicious Reports (SMR)

**Route:** `/admin/suspicious-reports`

### Purpose
Manage Suspicious Matter Reports for potential money laundering or terrorism financing.

### ⚠️ LEGAL DEADLINE
SMRs must be submitted to AUSTRAC within **3 business days** of forming a suspicion.

### How Reports Are Created
- **System-generated**: Automatic detection of suspicious patterns
- **Manual**: Created from transaction reviews or EDD investigations
- **Staff-raised**: Any staff member can raise a concern

### Report Statuses
| Status | Meaning |
|--------|---------|
| **Pending** | New report, needs investigation |
| **Under Review** | Currently being investigated |
| **Reported** | Submitted to AUSTRAC |
| **Dismissed** | Determined to be false positive |

### Review Process

#### Step 1: Filter and Review
- Default shows "Pending" reports
- Click to expand and see full details
- Note the "Days Remaining" indicator

#### Step 2: Investigate
- Review the suspicion category
- Examine the customer and transaction
- Gather additional information if needed
- Consider triggering an EDD investigation if warranted

#### Step 3: Make a Decision

**Mark Under Review**: If you need more time to investigate

**Submit to AUSTRAC**: If suspicion is confirmed
1. Log into AUSTRAC Online
2. File the Suspicious Matter Report
3. Note the AUSTRAC reference number
4. Back in admin portal, select the record
5. Enter the AUSTRAC reference
6. Click "Mark as Submitted"

**Dismiss**: If determined to be a false positive
1. Enter dismissal notes explaining why
2. Click "Dismiss"
3. Record will be archived

### Important Notes
- **Never tip off** the customer about an SMR
- All SMR activity is logged for audit purposes
- When in doubt, report - AUSTRAC prefers over-reporting

---

## 10. Staff Training

**Route:** `/admin/staff`

### Purpose
Maintain the AML/CTF Training Register per Section 3.1 of the program.

### AUSTRAC Requirement
All staff involved in AML/CTF activities must receive:
- **Initial Training**: Within 30 days of starting role
- **Annual Refresher**: Every 12 months thereafter
- **Role-Specific Training**: Based on job function

### Staff List
Shows all staff members with:
- Name and email
- Position and department
- Training status badge:
  - 🟢 **Compliant**: Training up to date
  - 🔴 **Overdue**: Training past due
  - ⚪ **No Training**: Never trained
  - ⚫ **Not Applicable**: Role doesn't require training

### Managing Staff

#### Add New Staff
1. Click "+ Add Staff Member"
2. Enter details:
   - Full name
   - Email address
   - Position
   - Department
   - Employment start date
   - Whether AML training is required
3. Optionally link to a Clerk user ID for system access

#### Record Training
Click on a staff member to:
- View training history
- Add new training record:
  - Training type (Initial, Refresher, Role-Specific, Advanced)
  - Date completed
  - Provider (Internal, AUSTRAC eLearning, External)
  - Topics covered
  - Duration
  - Pass score (if applicable)
  - Certificate URL

#### Deactivate Staff
When someone leaves:
1. Click "Deactivate" on their record
2. Enter end date
3. Records are retained for 7 years (AUSTRAC requirement)

---

## 11. Reports & Analytics

**Route:** `/admin/reports`

### Compliance Report Tab
Generate annual compliance summaries.

#### How to Generate
1. Select the year
2. Click "Generate Report"
3. Review on-screen OR export to CSV

#### Report Includes
- **Transaction Metrics**: Total count and value
- **AUSTRAC Reports**: TTRs and SMRs submitted
- **Customer Verification**: Rates and document counts
- **Staff Training**: Compliance stats
- **EDD Investigations**: Breakdown by status
- **Monthly Breakdown**: Transaction trends

### AUSTRAC Tracker Tab
Search and filter historical AUSTRAC submissions.

#### Features
- Filter by type (TTR, SMR)
- Filter by date range
- Search by customer name or reference
- Export filtered results

---

## 12. Audit Logs

**Route:** `/admin/audit-logs`

### Purpose
Complete trail of all system actions for accountability and compliance.

### What's Logged
Every significant action including:
- Document approvals/rejections
- Transaction reviews
- EDD investigation updates
- TTR/SMR submissions
- Customer data changes
- Staff management actions

### Filtering
| Filter | Use |
|--------|-----|
| Action Type | e.g., "customer_verified", "transaction_flagged" |
| Entity Type | e.g., "customer", "transaction", "document" |
| Entity ID | Specific UUID of record |
| Date Range | Time period to review |

### Exporting
Click "Export CSV" to download logs for:
- External audits
- AUSTRAC examinations
- Internal reviews

---

## 13. Quick Reference

### Daily Checklist
- [ ] Check Dashboard for action items
- [ ] Review pending documents
- [ ] Process flagged transactions
- [ ] Check TTR deadlines (10 business days)
- [ ] Check SMR deadlines (3 business days)
- [ ] Progress active EDD investigations

### Key Deadlines
| Report | Deadline |
|--------|----------|
| TTR | 10 business days from transaction |
| SMR | 3 business days from forming suspicion |
| EDD | Before approving transaction ≥$50,000 |

### Decision Quick Guide

#### Document Verification
```
Clear + Valid + (Certified if required) = APPROVE
Unclear OR Expired OR Invalid Certification = REJECT
```

#### Transaction Review
```
Legitimate + Verified Customer + No Red Flags = APPROVE
Suspicious Pattern OR Structuring = TRIGGER EDD or REJECT
Insufficient Verification = HOLD for verification
```

#### EDD Investigation
```
All Checks Pass + Sources Verified = APPROVE
Minor Concerns = ONGOING MONITORING
Major Concerns + Evidence = REJECT (needs management)
Criminal Activity Suspected = ESCALATE TO SMR
```

### Keyboard Shortcuts
- `Ctrl/Cmd + F`: Search on current page
- `Escape`: Close modal/dialog

---

## 14. Troubleshooting

### Common Issues

**Data not loading**
- Refresh the page (F5 or Ctrl/Cmd + R)
- Check your internet connection
- Clear browser cache if persistent

**Action failed (toast notification)**
- Read the error message carefully
- Check if all required fields are filled
- Ensure you have permission for that action
- Try again; if persistent, contact IT

**Can't approve high-risk EDD**
- Requires management approval first
- Ask a manager to click "Grant Management Approval"

**Document image won't load**
- May be a large file - wait longer
- Try a different browser
- Check if file exists in storage

### Getting Help
- Technical issues: Contact IT support
- Compliance questions: Contact AML/CTF Manager
- AUSTRAC queries: Refer to AUSTRAC website or contact your AUSTRAC liaison

---

## Appendix: AUSTRAC Contact Information

**AUSTRAC Online Portal:** https://online.austrac.gov.au

**AUSTRAC Help Desk:** 1300 021 037

**Email:** help_desk@austrac.gov.au

---

*This guide is for internal training purposes only. For official requirements, always refer to the AML/CTF Act 2006 and AML/CTF Rules.*
