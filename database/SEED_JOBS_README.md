# 🏢 Real World Jobs Seeder

Công cụ chuyên dụng để seed dữ liệu jobs thật từ các tập đoàn lớn vào database.

## 🎯 Mục đích

Seeder này tạo ra **25+ jobs thật** từ **10 tập đoàn lớn** tại Việt Nam để test các tính năng:
- Job search và filtering
- CV-Job matching algorithms  
- Salary analysis
- Company categorization
- Skills mapping

## 🏢 Các công ty được seed

| **Công ty** | **Lĩnh vực** | **Số jobs** | **Mức lương** |
|-------------|--------------|-------------|---------------|
| **VNG Corporation** | Technology | 3+ | 22-60M VND |
| **FPT Corporation** | IT Services | 2+ | 20-50M VND |
| **Vingroup** | Conglomerate | 2+ | 20-50M VND |
| **Sacombank** | Banking | 2+ | 15-40M VND |
| **Sendo** | E-commerce | 2+ | 18-42M VND |
| **Tiki** | E-commerce | 2+ | 18-45M VND |
| **Techcombank** | Digital Banking | 2+ | 15-70M VND |
| **Samsung Vietnam** | Electronics | 2+ | 25-40M VND |
| **MoMo** | Fintech | 2+ | 22-48M VND |
| **Shopee Vietnam** | E-commerce | 2+ | 15-45M VND |

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies
```bash
cd database
npm install
```

### 2. Cấu hình database
Đảm bảo file `database.env` đã được cấu hình đúng:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitment_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Chạy seeder

#### 🔍 Preview trước khi chạy (Recommended)
```bash
npm run seed:jobs:preview
# hoặc
node seed-jobs.js --dry-run
```

#### ✅ Chạy seeding bình thường
```bash
npm run seed:jobs
# hoặc  
node seed-jobs.js
```

#### 🧹 Xóa dữ liệu cũ và seed lại
```bash
npm run seed:jobs:clean
# hoặc
node seed-jobs.js --clean --stats
```

#### 💪 Force overwrite (nếu đã có dữ liệu)
```bash
npm run seed:jobs:force
# hoặc
node seed-jobs.js --force --stats
```

## ⚙️ Options chi tiết

| **Option** | **Mô tả** |
|------------|-----------|
| `--dry-run` | Preview SQL mà không thực thi |
| `--force` | Force execution kể cả khi đã có dữ liệu |
| `--clean` | Xóa dữ liệu seed cũ trước khi thêm mới |
| `--stats` | Hiển thị thống kê chi tiết sau khi seed |
| `--help` | Hiển thị hướng dẫn |

## 📊 Thống kê sau khi seed

Sử dụng `--stats` để xem:
- ✅ Tổng số companies, jobs, recruiters được tạo
- 📊 Phân bố jobs theo công ty và ngành nghề
- 💰 Mức lương trung bình theo experience level
- 🎯 Phân bố jobs theo Junior/Middle/Senior

## 🔧 Troubleshooting

### ❌ Connection failed
```bash
# Kiểm tra database có chạy không
pg_isready -h localhost -p 5432

# Test connection
npm run db:test
```

### ⚠️ Already exists error
```bash
# Dùng --force để overwrite
node seed-jobs.js --force

# Hoặc clean trước
node seed-jobs.js --clean
```

### 🔍 SQL syntax errors
```bash
# Preview SQL trước
node seed-jobs.js --dry-run

# Check logs
tail -f logs/seed-jobs.log
```

## 📁 Files được tạo

```
database/
├── seed-jobs.js              # Main seeder script  
├── seeds/003_real_world_jobs.sql  # SQL seed data
├── logs/seed-jobs.log         # Execution logs
└── SEED_JOBS_README.md        # This file
```

## 🎨 Sample Data Preview

### Backend Engineer (VNG)
- **Title**: Senior Backend Engineer - Zalo Platform
- **Salary**: 40-60M VND
- **Skills**: Java, Spring Framework, Microservices, Redis, Kafka
- **Level**: Senior (5-10 years)

### AI/ML Engineer (FPT)  
- **Title**: AI/ML Engineer - FPT.AI
- **Salary**: 30-50M VND
- **Skills**: Python, TensorFlow, Computer Vision, NLP
- **Level**: Middle (3-7 years)

### Mobile Developer (MoMo)
- **Title**: Senior Mobile Developer - iOS
- **Salary**: 32-48M VND  
- **Skills**: Swift, iOS Development, Payment Integration
- **Level**: Senior (4-7 years)

## ✨ Lợi ích

✅ **Realistic Data**: Lương và requirements thật từ thị trường  
✅ **Diverse Industries**: Tech, Banking, E-commerce, Manufacturing  
✅ **All Levels**: Junior → Senior → Lead positions  
✅ **Complete Info**: Skills, benefits, requirements chi tiết  
✅ **Safe Execution**: Dry-run, rollback, validation built-in  

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs: `tail -f database/logs/seed-jobs.log`
2. Run với `--dry-run` để debug
3. Verify database connection với `npm run db:test`
4. Clean và seed lại với `--clean --stats`

Happy Seeding! 🚀
