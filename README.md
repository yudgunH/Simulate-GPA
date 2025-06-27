# 📊 Simulate GPA

> **Ứng dụng tính toán và mô phỏng GPA học tập - Trước khi bảng điểm thật xuất hiện!** 🎓

## 🚀 Tổng quan

**Simulate GPA** là ứng dụng web hiện đại giúp sinh viên:

- ✅ **Tính toán GPA** chính xác với nhiều thang đo
- 📈 **Mô phỏng kết quả** học tập trong tương lai
- 📅 **Quản lý thời khóa biểu** chi tiết và trực quan
- 📊 **Xuất báo cáo Excel** chuyên nghiệp
- 💾 **Sao lưu dữ liệu** tự động và an toàn

## ✨ Tính năng nổi bật

### 🧮 Hệ thống GPA thông minh

- **6 thang đo tùy chỉnh**: Việt Nam 4.0, Mỹ 4.0/4.3, Simple 4.0/5.0
- **Tính toán real-time**: GPA học kỳ và tích lũy
- **Phân loại học lực**: Xuất sắc, Giỏi, Khá, Trung bình, Yếu
- **Đánh giá học bổng**: Tự động kiểm tra điều kiện

### 📊 Quản lý học tập

- **Nhiều học kỳ**: Thêm, sửa, xóa, sao chép học kỳ
- **Quản lý môn học**: Tên môn, tín chỉ, điểm số
- **Gợi ý cải thiện**: AI suggestions để nâng cao GPA
- **Backup tự động**: 5 bản sao lưu gần nhất

### 📅 Thời khóa biểu đầy đủ

- **2 chế độ xem**: Grid (lưới) và List (danh sách)
- **Thời gian linh hoạt**: Preset + Custom time input
- **Phát hiện xung đột**: Thông báo và tùy chọn thay thế
- **Thông tin chi tiết**: Phòng, giảng viên, loại tiết, ghi chú
- **5 cách xóa lịch**: Từ từng lịch đến toàn bộ học kỳ

### 📥📤 Import/Export mạnh mẽ

- **Excel format**: Xuất bảng điểm và thời khóa biểu
- **JSON backup**: Sao lưu và khôi phục dữ liệu
- **Template import**: Import từ file Excel có sẵn
- **Multiple sheets**: Tổng quan, chi tiết, thống kê

### 🎯 Mô phỏng kết quả

- **Dự đoán GPA**: Với điểm số giả định
- **Scenario planning**: Nhiều kịch bản khác nhau
- **Goal setting**: Tính toán điểm cần thiết

## 🛠️ Công nghệ sử dụng

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: React Hooks, Custom Components

### Data & Storage

- **Storage**: localStorage với backup system
- **Export**: XLSX library cho Excel
- **State**: React useState/useEffect

### Features

- **Responsive Design**: Mobile-first approach
- **PWA Ready**: Có thể cài đặt như app
- **Performance**: Optimized với Next.js
- **Accessibility**: ARIA labels và keyboard support

## 📦 Cài đặt và chạy

### Yêu cầu hệ thống

- **Node.js**: 18.17+
- **npm**: 9.0+ hoặc yarn 1.22+

### Clone và cài đặt

```bash
# Clone repository
git clone https://github.com/yourusername/simulate-gpa.git
cd simulate-gpa

# Cài đặt dependencies
npm install
# hoặc
yarn install

# Chạy development server
npm run dev
# hoặc
yarn dev

# Mở browser tại http://localhost:3000
```

### Build production

```bash
# Build ứng dụng
npm run build
npm start

# hoặc
yarn build
yarn start
```

## 📖 Hướng dẫn sử dụng

### 🎯 Bắt đầu nhanh

1. **Thêm môn học**: Click "➕ Thêm môn" và nhập thông tin
2. **Nhập điểm**: Điền điểm số (0-10) cho từng môn
3. **Xem kết quả**: GPA hiển thị real-time bên phải
4. **Xuất báo cáo**: Click "📊 Xuất Excel" để tải file

### 📚 Quản lý học kỳ

```
📚 Quản lý học kỳ
├── ➕ Thêm học kỳ mới
├── 📋 Sao chép học kỳ hiện tại
├── ✏️ Sửa tên học kỳ
└── 🗑️ Xóa học kỳ (có xác nhận)
```

### ⚙️ Cấu hình thang đo

1. Click "⚙️ Cấu hình thang đo"
2. Chọn preset hoặc tùy chỉnh:
   - **Việt Nam (4.0)**: A+=4.0, A=3.7, B+=3.3...
   - **Mỹ (4.0)**: A=4.0, B=3.0, C=2.0...
   - **Simple (4.0/5.0)**: A,B,C,D không dấu cộng
3. Preview và lưu cài đặt

### 📅 Thời khóa biểu

1. **Mở modal**: Click "📅 Thời khóa biểu"
2. **Thêm lịch**: Chọn môn → "➕ Thêm lịch học"
3. **Nhập thông tin**:
   - Thứ trong tuần
   - Thời gian (Preset hoặc Custom)
   - Phòng học, giảng viên
   - Loại tiết, ghi chú
4. **Xử lý xung đột**: Chọn thay thế hoặc giữ cả hai

### 📊 Export dữ liệu

| Tính năng             | Mô tả            | File output                      |
| --------------------- | ---------------- | -------------------------------- |
| **📊 Xuất Excel**     | Bảng điểm đầy đủ | `BangDiem_[Tên]_[Ngày].xlsx`     |
| **📅 Xuất TKB Excel** | Thời khóa biểu   | `ThoiKhoaBieu_[Tên]_[Ngày].xlsx` |
| **📥 Xuất JSON**      | Backup dữ liệu   | `gpa-data-[Ngày].json`           |

## 🏗️ Cấu trúc dự án

```
simulate-gpa/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── BackupModal.tsx    # Quản lý backup
│   ├── GPASettingsModal.tsx # Cấu hình thang đo
│   ├── ScheduleModal.tsx  # Thời khóa biểu
│   └── SimulationModal.tsx # Mô phỏng kết quả
├── types/                 # TypeScript types
│   └── index.ts          # Định nghĩa interfaces
├── utils/                 # Utility functions
│   ├── gpa.ts            # Logic tính GPA
│   └── storage.ts        # Quản lý dữ liệu
├── public/               # Static assets
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind CSS config
├── tsconfig.json         # TypeScript config
└── next.config.js        # Next.js config
```

## 🔧 API và Types

### Core Types

```typescript
interface StudentRecord {
  id: string;
  studentName: string;
  semesters: Semester[];
  gpaSettings: GPASettings;
  cumulativeGPA: number;
}

interface Subject {
  id: string;
  name: string;
  credits: number;
  grade: number | null;
  schedule?: ClassSchedule[];
}

interface ClassSchedule {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  room: string;
  type: "lecture" | "lab" | "tutorial" | "exam";
  instructor?: string;
  note?: string;
}
```

### Utility Functions

```typescript
// Tính GPA học kỳ
calculateSemesterGPA(subjects: Subject[], settings: GPASettings): number

// Tính GPA tích lũy
calculateCumulativeGPA(semesters: Semester[], settings: GPASettings): number

// Xuất Excel
exportSimpleExcel(data: StudentRecord): void
exportScheduleToExcel(data: StudentRecord, semesterIndex?: number): void

// Quản lý storage
saveDataWithBackup(data: StudentRecord): void
restoreFromBackup(): StudentRecord[]
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Thêm/sửa/xóa môn học
- [ ] Tính toán GPA với các thang đo khác nhau
- [ ] Import/Export Excel và JSON
- [ ] Quản lý thời khóa biểu
- [ ] Phát hiện và xử lý xung đột lịch
- [ ] Backup và restore dữ liệu
- [ ] Responsive trên mobile/tablet

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Đóng góp

### Quy trình đóng góp

1. **Fork** repository
2. **Clone** về máy local
3. Tạo **feature branch**: `git checkout -b feature/amazing-feature`
4. **Commit** thay đổi: `git commit -m 'Add amazing feature'`
5. **Push** branch: `git push origin feature/amazing-feature`
6. Tạo **Pull Request**

### Coding Standards

- **TypeScript**: Sử dụng strict mode
- **ESLint**: Follow Next.js config
- **Prettier**: Format code tự động
- **Comments**: Tiếng Việt cho logic phức tạp

## 📝 Changelog

### v2.0.0 (Latest)

- ✨ **Thời khóa biểu hoàn chỉnh** với Grid/List view
- ✨ **Custom time input** cho lịch học linh hoạt
- ✨ **Conflict detection** và auto-replace
- ✨ **5 cách xóa lịch** từ riêng lẻ đến hàng loạt
- ✨ **Export Excel** cho thời khóa biểu
- 🔧 **6 thang đo GPA** tùy chỉnh
- 🔧 **Backup system** với 5 restore points

### v1.0.0

- 🎉 **Release đầu tiên** với core GPA features
- 📊 **Basic Excel export**
- 💾 **localStorage integration**
- 🎯 **Simulation modal**

## 🙏 Acknowledgments

- **Next.js team** - Amazing React framework
- **Tailwind CSS** - Utility-first CSS framework
- **XLSX library** - Excel file processing
- **Vercel** - Hosting và deployment platform

## 📞 Liên hệ và Hỗ trợ

- **📧 Email**: support@simulate-gpa.com
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/yourusername/simulate-gpa/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/yourusername/simulate-gpa/discussions)
- **📚 Documentation**: [Wiki](https://github.com/yourusername/simulate-gpa/wiki)

---

<div align="center">

**⭐ Nếu dự án hữu ích, hãy cho chúng tôi một Star! ⭐**

Made with ❤️ by Vietnamese Developers

[🚀 Live Demo](https://simulate-gpa.vercel.app) | [📖 Documentation](https://github.com/yourusername/simulate-gpa/wiki) | [🐛 Report Bug](https://github.com/yourusername/simulate-gpa/issues)

</div>
