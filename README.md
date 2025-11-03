# MNMS Portal

## Overview
MNMS Portal is a React-based web application for visualizing, importing, editing, and exporting MNMS-formatted files. It provides a form-wizard UI with collapsible sections.

## Prerequisites
- Node.js (>=14.x)
- npm (>=6.x)

## Installation
```bash
git clone <repo-url>
cd mnms-portal
npm install
```

## Running Locally
```bash
npm start
```
Opens http://localhost:3000.

## Building for Production
```bash
npm run build
```
Outputs static files to the `build/` directory.

## Usage
1. Click “Browse CSV/XLSX File” to import a file with the MNMS schema, or click “Add Animal” to start with a blank row.
2. Supported formats: `.csv`, `.xlsx`, `.xls`.
3. The app validates the header row. Required columns are:
   - Unique_Animal_Identifier, Local_Identifiers, Species, Strain_ILAR_Name, Strain_Short_Name, Sex, Transgenic, Genotype_Information, Allele_Information, Animal_Vendor, Date_of_Birth, Developmental_Stage, Animal_Weight_at_Start, Weight_Unit, Severity_Grade_of_Manipulation, In-life_Phase_Start_Date, In-life_Phase_End_Date, Test_Substance_Common_Name, Test_Substance_CAS_Number, Numerical_Dose, Dose_Unit, Vehicle_Composition, Route_of_Administration, Administration_Method, Testing_Location, Light_Cycle, Enrichment, Outcome_Measure, Value, Unit_of_Measurement
4. Edit fields inline in the multi‑subject grid or single‑subject view.
5. Click “Export CSV” to download a `.csv` or “Export XLSX” to download an `.xlsx`, both using the same header schema.

## Deployment
Host the `build/` folder on any static hosting (Netlify, Vercel, S3). For sensitive data, serve over HTTPS and configure authentication (e.g., Auth0, AWS Cognito).

## Sample Data
- Example file: `data/Roche_MNMS_VEH.csv`

## Security
- Use HTTPS.
- Protect access with authentication.
- Encrypt data at rest if storing on server.

## Extending
- Add field validation in `Section` component.
- Integrate server-side API with FastAPI/Flask for persistent storage.
