# Check-ins Content Format Guide

## Overview
Micro-inserts are short, diagnosis-specific messages included in check-in emails. They must be carefully crafted to be supportive, educational, and compliant.

## File Formats

### CSV Format
```csv
diagnosis_code,day,branch,insert_text
sciatica,3,initial,Short gentle movement breaks today.
sciatica,3,better,Keep current routine; progress slowly.
sciatica,3,same,Try varying movement patterns.
sciatica,3,worse,Rest and gentle stretches only.
```

### YAML Format
```yaml
- diagnosis_code: sciatica
  day: 3
  branch: initial
  insert_text: Short gentle movement breaks today.

- diagnosis_code: sciatica
  day: 3
  branch: better
  insert_text: Keep current routine; progress slowly.
```

## Field Requirements

### diagnosis_code
- **Type**: String (max 50 characters)
- **Values**: Must match diagnosis codes from assessment system
- **Special**: Use `generic` for fallback messages
- **Examples**: `sciatica`, `facet_arthropathy`, `canal_stenosis`, `generic`

### day
- **Type**: Integer
- **Values**: Must be exactly `3`, `7`, or `14`
- **Purpose**: Days after assessment when message is sent

### branch
- **Type**: String
- **Values**: Must be one of:
  - `initial` - First check-in, no prior response
  - `better` - User indicated improvement
  - `same` - User indicated no change
  - `worse` - User indicated worsening

### insert_text
- **Type**: String
- **Max Length**: 25 words (strictly enforced)
- **Purpose**: Brief, supportive message specific to condition and progress

## Content Guidelines

### Word Limit
- **Maximum**: 25 words per insert
- **Why**: Keeps emails concise and readable
- **Tip**: Focus on one clear action or encouragement

### Forbidden Phrases
The following phrases/terms are automatically rejected:
- `guaranteed`, `cure`, `eliminate`
- `miracle`, `breakthrough`
- `medical emergency`, `call 911`
- `immediate surgery`
- `proven to work`, `100%`, `risk-free`
- `money-back`
- `clinical trial`, `FDA approved`
- `doctor recommended`

### Writing Tips
✅ **DO:**
- Use supportive, encouraging language
- Suggest gentle activities
- Acknowledge progress or challenges
- Keep it simple and actionable

❌ **DON'T:**
- Make medical claims
- Suggest specific diagnoses
- Promise outcomes
- Use urgent/alarming language

## File Limits
- **Maximum rows per file**: 300
- **Reason**: Prevents accidental bulk imports
- **Solution**: Split large datasets into multiple files

## Import Process

### 1. Prepare Your File
Create a CSV or YAML file following the format above. Use the sample file as a template:
```bash
cp content/checkins/micro-inserts.sample.csv content/checkins/my-inserts.csv
```

### 2. Validate with Dry Run
Always test with `--dry-run` first:
```bash
npx tsx scripts/checkins-import.ts --file content/checkins/my-inserts.csv --dry-run
```

This will:
- Validate all entries
- Show what would be inserted/updated
- Report any errors without making changes

### 3. Import for Real
Once validation passes:
```bash
npx tsx scripts/checkins-import.ts --file content/checkins/my-inserts.csv
```

### 4. Verify Import
Check the summary output:
```
📊 Import Summary:
  ✅ Inserted: 12
  📝 Updated: 3
  ⏭️  Skipped: 0
```

## Example Inserts

### Good Examples ✅
```csv
sciatica,3,initial,Focus on gentle movement today.
sciatica,7,better,Great progress! Keep it steady.
facet_arthropathy,14,worse,Consider modifying your routine. Rest is okay.
generic,3,initial,Small steps lead to progress.
```

### Bad Examples ❌
```csv
sciatica,3,initial,This revolutionary treatment is guaranteed to cure your back pain in just 3 days with our breakthrough method! (Too long, forbidden phrases)
sciatica,5,initial,Keep moving. (Invalid day - must be 3, 7, or 14)
sciatica,3,improving,You're doing well. (Invalid branch - use 'better' not 'improving')
```

## Troubleshooting

### Common Errors

**"Insert text has 32 words (max 25)"**
- Solution: Shorten the message. Count words carefully.

**"Contains forbidden phrase 'guaranteed'"**
- Solution: Rewrite without medical claims or promises.

**"Invalid day 5. Must be 3, 7, or 14"**
- Solution: Use only the allowed day values.

**"File contains 512 rows (max 300)"**
- Solution: Split into multiple files of <300 rows each.

### Database Conflicts
The importer uses "upsert" logic:
- If an entry exists (same diagnosis_code + day + branch), it updates
- If not, it inserts as new
- This makes imports idempotent (safe to run multiple times)

## Security Notes
- Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Never commit actual insert files to git (add to .gitignore)
- Always review content before importing to production
- Keep backups of previous content versions