# 📊 Simulate GPA - Ứng dụng tính toán và mô phỏng GPA

## 🎯 Mục tiêu

Ứng dụng web giúp sinh viên:
- **Nhập điểm từng môn** (hoặc điểm kỳ vọng)
- **Tính toán GPA** học kỳ và GPA toàn khóa
- **Mô phỏng tình huống**: Rớt môn, đạt A, ảnh hưởng đến học bổng
- **Gợi ý cải thiện**: Cần bao nhiêu điểm để đạt học bổng/loại khá giỏi

## ✨ Tính năng chính

### 📚 Quản lý điểm số
- Nhập bảng điểm theo từng học kỳ
- Tên môn, số tín chỉ, điểm số (thang 10)
- Hỗ trợ nhiều học kỳ

### 🧮 Tính toán GPA
- GPA học kỳ hiện tại  
- GPA tích lũy toàn khóa
- Chuyển đổi tự động sang thang 4.0
- Xác định học lực (Xuất sắc, Giỏi, Khá, TB, Yếu, Kém)

### 🎯 Mô phỏng kết quả
- **Thay đổi điểm**: Xem GPA thay đổi thế nào nếu điều chỉnh điểm môn X
- **Tình huống nhanh**: Ảnh hưởng nếu rớt 1 môn hoặc đạt 9.0
- **Mục tiêu GPA**: Tính toán điểm cần thiết để đạt GPA mong muốn

### 🏆 Theo dõi học bổng
- Kiểm tra đủ điều kiện các loại học bổng
- Gợi ý cải thiện để đạt mục tiêu
- Cảnh báo rủi ro mất học bổng

### 💾 Lưu trữ và chia sẻ
- Tự động lưu dữ liệu với localStorage
- Export/Import file .json để backup
- Dữ liệu được bảo toàn giữa các phiên

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Cài đặt
```bash
# Clone repository
git clone https://github.com/your-username/Simulate-GPA.git
cd Simulate-GPA

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Hoặc build production
npm run build
npm start
```

### Truy cập ứng dụng
Mở trình duyệt và vào: `http://localhost:3000`

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Emoji (không cần icon library)
- **Storage**: localStorage (không cần backend)
- **Build**: Next.js static export

## 📖 Hướng dẫn sử dụng

### 1. Nhập điểm số
- Chọn học kỳ hiện tại hoặc tạo học kỳ mới
- Thêm các môn học với tên, tín chỉ và điểm
- Hệ thống tự động tính GPA khi bạn nhập

### 2. Xem kết quả
- **GPA học kỳ**: Điểm trung bình học kỳ hiện tại
- **GPA tích lũy**: Điểm trung bình toàn khóa
- **Học lực**: Xếp loại theo thang GPA
- **Học bổng**: Kiểm tra đủ điều kiện

### 3. Mô phỏng tình huống
- Click "🎯 Mô phỏng kết quả"
- Thay đổi điểm môn bất kỳ để xem ảnh hưởng
- Đặt mục tiêu GPA để tính điểm cần thiết
- Xem tình huống nhanh (rớt môn, đạt cao điểm)

### 4. Backup dữ liệu
- "📥 Xuất file": Tải về file .json chứa toàn bộ dữ liệu
- "📤 Nhập file": Khôi phục từ file backup

## 🎨 Giao diện

### Desktop
- Layout 3 cột: Form nhập (2/3) + Kết quả (1/3)
- Bảng nhập điểm trực quan
- Card hiển thị kết quả rõ ràng

### Mobile  
- Responsive design
- Stack layout cho màn hình nhỏ
- Touch-friendly controls

## 📊 Thang điểm

### Chuyển đổi điểm số sang GPA 4.0
- **A (4.0)**: 8.5 - 10.0 điểm
- **B+ (3.5)**: 8.0 - 8.4 điểm  
- **B (3.0)**: 7.0 - 7.9 điểm
- **C+ (2.5)**: 6.5 - 6.9 điểm
- **C (2.0)**: 5.5 - 6.4 điểm
- **D+ (1.5)**: 5.0 - 5.4 điểm
- **D (1.0)**: 4.0 - 4.9 điểm
- **F (0.0)**: 0.0 - 3.9 điểm

### Xếp loại học lực
- **Xuất sắc**: GPA ≥ 3.6
- **Giỏi**: GPA 3.2 - 3.59
- **Khá**: GPA 2.5 - 3.19  
- **Trung bình**: GPA 2.0 - 2.49
- **Yếu**: GPA 1.0 - 1.99
- **Kém**: GPA < 1.0

## 🔮 Tính năng tương lai

- [ ] So sánh GPA với bạn bè (ẩn danh)
- [ ] Biểu đồ tiến trình GPA theo thời gian
- [ ] Dự đoán GPA tốt nghiệp
- [ ] Export PDF báo cáo đẹp
- [ ] Tích hợp lịch học và deadline
- [ ] Thông báo nhắc nhở mục tiêu
- [ ] Chia sẻ thành tích lên mạng xã hội

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy:

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📝 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 💡 Ý tưởng và feedback

Có ý tưởng hay gặp bug? Hãy tạo issue trên GitHub!

---

**🎓 Chúc bạn học tập thành công và đạt GPA cao!**