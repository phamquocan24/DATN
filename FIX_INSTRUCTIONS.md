# 🔧 Fix Instructions for Application Integration Errors

## 🎯 Lỗi cần sửa

1. **CV Error**: `User.findById is not a function` ✅ **ĐÃ SỬA**
2. **Database Error**: `column a.match_score does not exist` ⚠️ **CẦN CHẠY MIGRATION**

## ✅ 1. CV Error - ĐÃ SỬA

**File đã sửa**: `services/business-service/controllers/CVController.js`

**Thay đổi**:
```javascript
// Trước (lỗi)
const user = await User.findById(userId);

// Sau (đã sửa)  
const userModel = new User();
const user = await userModel.findById(userId);
```

## ⚠️ 2. Database Error - CẦN CHẠY MIGRATION

### Cách 1: Chạy migration SQL trực tiếp

1. **Mở tool PostgreSQL** (pgAdmin, DBeaver, hoặc psql command line)

2. **Connect đến database** `hr_management`

3. **Chạy nội dung file** `database/migrations/004_fix_match_score_column.sql`:

```sql
BEGIN;

-- Add ai_match_score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'ai_match_score'
  ) THEN
    ALTER TABLE applications ADD COLUMN ai_match_score DECIMAL(5,2);
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'applications' 
      AND column_name = 'match_score'
    ) THEN
      UPDATE applications SET ai_match_score = match_score WHERE match_score IS NOT NULL;
    END IF;
    
    RAISE NOTICE 'Added ai_match_score column to applications table';
  END IF;
END
$$;

-- Add match_score column if it doesn't exist (backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'match_score'
  ) THEN
    ALTER TABLE applications ADD COLUMN match_score DECIMAL(5,2);
    UPDATE applications SET match_score = ai_match_score WHERE ai_match_score IS NOT NULL;
    RAISE NOTICE 'Added match_score column to applications table';
  END IF;
END
$$;

COMMIT;
```

### Cách 2: Chạy migration script (nếu có password PostgreSQL)

```bash
cd database

# Cập nhật password trong run_migration_004.js
# Sửa dòng: password: 'your_password' → password: 'PASSWORD_THỰC_TẾ'

node run_migration_004.js
```

## 🚀 3. Restart Services

Sau khi chạy migration:

```bash
# 1. Restart business-service
cd services/business-service
npm start

# 2. Restart frontend (nếu cần)  
cd services/frontend-service
npm run dev
```

## 🧪 4. Test Integration

### Test 1: CV Loading
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5001/api/v1/cvs/my-cvs
```

**Expected**: `{"success": true, "data": [...], ...}`

### Test 2: Applications Loading  
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5001/api/v1/applications/my-applications
```

**Expected**: `{"success": true, "data": [...], ...}`

### Test 3: Application Submission
1. Go to job detail page in frontend
2. Click "Apply" button  
3. Fill form and submit
4. Should show success message

## 🔍 Verification Queries

Để verify migration đã chạy thành công:

```sql
-- Check if both columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('match_score', 'ai_match_score');

-- Test COALESCE query (giống trong Application.js)
SELECT 
  application_id,
  COALESCE(ai_match_score, match_score) as match_score
FROM applications 
LIMIT 5;
```

## 📋 Summary

| Issue | Status | Action Required |
|-------|--------|----------------|
| CV `User.findById` error | ✅ Fixed | None - already updated in code |
| Database `match_score` error | ⚠️ Pending | Run migration SQL above |
| Apply button integration | ✅ Ready | Test after migration |

**Sau khi chạy migration, tất cả sẽ hoạt động bình thường!** 🎉
