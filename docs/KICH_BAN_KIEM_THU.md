# Kịch bản kiểm thử toàn dự án AI Recruiting Platform

**Phiên bản tài liệu:** 1.0  
**Phạm vi đọc:** Frontend Next.js (`app/`, `components/`, `lib/`, `types/`), backend FastAPI (`api/app/`), worker Celery, cấu hình triển khai, schema/migration và bộ kiểm thử hiện có.  
**Mục đích:** Bộ kiểm thử hồi quy chức năng, tích hợp và chấp nhận người dùng; đây là kế hoạch kiểm thử, chưa phải kết quả chạy thực tế.

## 1. Tóm tắt kiến trúc và phạm vi

Ứng dụng quản lý tuyển dụng đa công ty. Ứng viên xem việc làm, trò chuyện hỏi đáp, nộp CV và tra cứu trạng thái; HR quản lý tin tuyển dụng, ứng viên, pipeline, lịch phỏng vấn, đánh giá và talent pool. Backend FastAPI cung cấp API, PostgreSQL lưu dữ liệu, Redis/Celery xử lý tác vụ, lớp AI hỗ trợ parse/matching/câu hỏi/transcript, email service phát hành thư. Frontend là Next.js App Router.

Phạm vi kịch bản bao gồm:

- API và UI: đăng nhập, phân quyền/phân tách tenant, JD, hồ sơ, pipeline, lịch, đánh giá, email, báo cáo và talent pool.
- AI: CV parsing/matching, gợi ý câu hỏi, phân tích transcript, embeddings/chat và xử lý đầu ra lỗi.
- Tệp: PDF/DOCX, avatar, audio, dung lượng/định dạng lỗi, consent và truy cập tài nguyên.
- Hạ tầng: migration/schema, health, Redis/Celery, cấu hình mock/provider, Docker Compose, frontend build và proxy API.

## 2. Quy ước thực thi

- Ưu tiên staging hoặc môi trường kiểm thử riêng; không dùng dữ liệu HR/ứng viên thật. Dùng `LLM_PROVIDER=mock`, STT/email mock cho hồi quy xác định được; chạy thêm bộ smoke với provider thật ở môi trường riêng nếu cần.
- Tạo hai công ty A/B, HR thuộc mỗi công ty, một interviewer, JD ở các trạng thái draft/published/closed, ứng viên với CV hợp lệ và lỗi. Gắn mã chạy vào email/tên để dọn dữ liệu.
- Luồng đa bước: ghi lại ID trả về và dùng xuyên suốt; xóa hoặc rollback dữ liệu sau kiểm thử. Với gửi email, chỉ dùng mailbox sandbox/mock.
- Mã HTTP mong đợi dưới đây là tiêu chí đề xuất theo REST; xác nhận lại khi hợp đồng API hiện hành khác.
- Khi xác minh async worker, chờ trạng thái cuối có timeout hữu hạn, kiểm tra log lỗi/retry và tránh khẳng định chỉ dựa trên HTTP nhận task.

## 3. Bộ dữ liệu chuẩn

| Mã | Dữ liệu |
|---|---|
| D-A | Công ty A; HR-A; interviewer-A; JD Backend có tiêu chí tổng trọng số 1.0 |
| D-B | Công ty B; HR-B; JD riêng, dùng kiểm tra cô lập tenant |
| D-CV1 | Ứng viên mới, CV PDF/DOCX hợp lệ, email duy nhất, kỹ năng khớp JD |
| D-CV2 | Ứng viên khác email, CV thiếu nội dung/không khớp JD |
| D-FILE | Tệp .exe đổi đuôi PDF, file rỗng, định dạng không hỗ trợ, tên Unicode, tệp quá giới hạn |
| D-AUDIO | Audio ngắn kiểm thử không chứa dữ liệu nhạy cảm; biến thể giả/không hợp lệ |

## 4. Kịch bản chi tiết

### A. Khởi động, cấu hình và xác thực

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| ENV-01 | P0 | Khởi động API với cấu hình kiểm thử và gọi `GET /`, `GET /health`, `/docs`. | API trả 200, metadata phù hợp; health không lộ secret/connection string. |
| ENV-02 | P0 | Khởi động frontend và mở `/`, `/jobs/public`; thử gọi API qua proxy `/api/v1`. | Trang render; proxy trỏ đúng backend; lỗi backend hiển thị trạng thái có thể hiểu, không treo vô hạn. |
| ENV-03 | P1 | Khởi tạo DB mới bằng migration; kiểm tra các bảng nghiệp vụ và chỉ mục/khóa ngoại. | Migration chạy từ đầu thành công, schema tương thích model; chạy lại migration không phá dữ liệu. |
| ENV-04 | P1 | Khởi động Redis và worker; gửi một tác vụ CV/email/audio mẫu. | Worker đăng ký task, nhận task và cập nhật trạng thái/log hoặc kết quả; task lỗi có thông tin chẩn đoán. |
| AUTH-01 | P0 | Đăng ký HR với dữ liệu hợp lệ, đăng nhập, gọi `/auth/me`. | Tạo tài khoản/công ty đúng; token hợp lệ; profile đúng. Vai trò đầu vào không được tự nâng quyền (ví dụ `super_admin` bị bỏ qua/400). |
| AUTH-02 | P0 | Đăng ký email trùng, email sai định dạng, thiếu trường, mật khẩu yếu; đăng nhập sai mật khẩu/email. | Trả lỗi 4xx có thông báo an toàn; không tạo bản ghi phụ; không tiết lộ email tồn tại qua thông báo phân biệt nếu chính sách yêu cầu. |
| AUTH-03 | P0 | Gọi endpoint bảo vệ khi thiếu token, token hỏng, hết hạn, sai scheme. | 401/403 phù hợp; không truy xuất dữ liệu. |
| AUTH-04 | P0 | Tạo HR-A và HR-B; HR-A thử đọc/sửa tài nguyên công ty B bằng ID hợp lệ. | Bị từ chối/không tìm thấy; không rò rỉ dữ liệu trong nội dung, số lượng, lỗi hoặc log client. |
| AUTH-05 | P1 | Kiểm tra role interviewer/HR trên các thao tác tạo JD, pipeline, đánh giá và email. | Chỉ role được phép thao tác; quyền đọc và ghi nhất quán ở mọi route. |
| AUTH-06 | P1 | Frontend mở phiên đăng nhập, refresh trang, đăng xuất, dùng token hết hạn và thử cơ chế retry của `lib/api/client.ts`. | Trạng thái phiên nhất quán; logout xóa thông tin xác thực; retry không lặp thao tác ghi gây trùng. |

### B. Tin tuyển dụng và cổng công khai

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| JOB-01 | P0 | HR-A tạo JD đủ trường; xem danh sách/chi tiết; cập nhật mô tả và trọng số. | 201 khi tạo; dữ liệu đọc lại chính xác; company/creator gán từ phiên; tổng trọng số và kiểu dữ liệu được validate. |
| JOB-02 | P0 | Thử thiếu title, chuỗi quá dài, trọng số âm/>1, trọng số tổng không hợp lệ, payload sai kiểu. | 422/4xx; không lưu dữ liệu không hợp lệ. |
| JOB-03 | P0 | Xuất bản JD draft; liệt kê tin công khai, truy cập slug. Sau đó đóng/tạm dừng JD. | Vòng đời trạng thái đúng; chỉ tin đang mở xuất hiện và nhận ứng tuyển; slug ổn định/duy nhất; tin đóng không còn công khai. |
| JOB-04 | P1 | Đọc/sửa JD của công ty B bằng token HR-A; publish/close JD không thuộc quyền. | Bị chặn theo tenant/quyền. |
| JOB-05 | P1 | Tìm slug không tồn tại, slug Unicode/đụng slug, phân trang danh sách công khai. | 404 thích hợp; slug được chuẩn hóa/duy nhất; phân trang không lặp hoặc bỏ sót. |
| JOB-06 | P1 | UI `/jobs` tạo/sửa/xuất bản/đóng JD, kiểm tra modal, trạng thái loading/error và refresh. | Nội dung UI phản ánh API; thao tác lỗi không hiển thị thành công giả; điều khiển dùng được bằng bàn phím. |
| JOB-07 | P1 | UI `/jobs/public`, `/jobs/[slug]`, `/careers`, widget chat: xem danh sách/chi tiết, không có việc, API lỗi, hỏi chat rỗng/hợp lệ. | Render dữ liệu đúng và fallback có hướng dẫn; đầu vào rỗng bị chặn; nội dung AI được hiển thị an toàn. |

### C. Hồ sơ ứng viên, CV, matching và pipeline

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| CAN-01 | P0 | Ứng viên nộp D-CV1 vào JD published không cần tài khoản; theo dõi xử lý parse/matching. | Tạo candidate/application; trạng thái ban đầu đúng; score trong 0–100; breakdown giải thích được; lỗi AI không làm mất hồ sơ. |
| CAN-02 | P0 | Nộp vào JD draft/closed/hết hạn và job ID không tồn tại. | Từ chối 4xx; không tạo candidate/application rác. |
| CAN-03 | P0 | Nộp cùng email vào JD thứ hai, rồi gửi lại cùng JD (tuần tự và đồng thời). | Gộp candidate theo đúng phạm vi công ty/chính sách; lịch sử ứng tuyển được giữ; không tạo application trùng ngoài chính sách. |
| CAN-04 | P0 | Upload PDF/DOCX hợp lệ có tên tiếng Việt/khoảng trắng; xác minh CV lưu, parse dữ liệu và đường dẫn. | Nội dung trích xuất đúng mức; tên tệp được xử lý an toàn; dữ liệu ứng viên hiển thị đúng; không ghi tệp ngoài storage. |
| CAN-05 | P0 | Upload D-FILE lần lượt; thử MIME giả, file rỗng, quá lớn, tên chứa `../`, Unicode. | Định dạng/nội dung xác thực; trả lỗi phù hợp; không thực thi hoặc phục vụ file nguy hiểm; không để tệp mồ côi. |
| CAN-06 | P1 | Nộp CV có avatar, CV không ảnh và ảnh logo/icon; kiểm tra URL và `GET /candidates/{id}/avatar`, `/storage/...`. | Avatar hợp lệ được lưu/hiển thị; ảnh vắng mặt dùng fallback; endpoint không cho truy cập tệp tùy ý. |
| CAN-07 | P0 | HR-A liệt kê ứng viên, xem chi tiết, thống kê; truy cập candidate thuộc công ty B. | Chỉ dữ liệu đúng tenant; thống kê khớp tập kết quả; API trả lỗi có kiểm soát khi ID không tồn tại. |
| CAN-08 | P0 | HR thay trạng thái pipeline qua các bước hợp lệ; thử giá trị sai và cập nhật đồng thời. | Trạng thái hợp lệ được lưu, ghi chú không mất; trạng thái sai bị từ chối; không làm application biến mất/nhảy trạng thái. |
| CAN-09 | P1 | HR gửi feedback AI với rating biên 1, 5, 0, 6 và comment dài/Unicode. | Chỉ rating trong miền cho phép được lưu; feedback gắn đúng application/người/company. |
| CAN-10 | P1 | Tìm kiếm talent pool với query rỗng/hợp lệ, filter; rediscover vào JD; thử ứng viên chéo tenant. | Kết quả phù hợp và có giới hạn; thao tác tái khám phá tạo liên kết đúng; không lộ tenant khác. |
| CAN-11 | P1 | Tra cứu tình trạng ứng tuyển bằng email hợp lệ, email sai/không tồn tại và nhiều đơn ứng tuyển. | Chỉ trả dữ liệu tối thiểu cần thiết; không làm lộ hồ sơ người khác; trạng thái và JD khớp. |
| CAN-12 | P1 | UI `/candidates`, `/candidates/[id]`, `/pipeline`, `/talent-pool`: tìm, lọc, mở chi tiết, kéo/thả, feedback, rediscover. | Giao diện cập nhật sau API; lỗi/empty state đúng; dữ liệu không bị mất khi reload; avatar fallback. |

### D. Lịch phỏng vấn và phản hồi ứng viên

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| INT-01 | P0 | HR lên lịch ứng viên ở thời điểm tương lai, online với URL/meeting link; kiểm tra danh sách/chi tiết. | Interview gắn application, interviewer, company đúng; ngày giờ và timezone chính xác; online có thông tin cần thiết. |
| INT-02 | P0 | Tạo lịch offline có phòng; thiếu phòng, sai thời lượng, thời điểm quá khứ, interviewee không tồn tại. | Hợp lệ được lưu; payload thiếu/sai bị từ chối, không sinh lịch một phần. |
| INT-03 | P0 | Đặt hai lịch giao nhau cho cùng interviewer (bao gồm request đồng thời), lịch liền kề không giao nhau. | Chặn overlap theo quy tắc; lịch liền kề cho phép nếu không chồng; xử lý cạnh tranh không tạo double-book. |
| INT-04 | P1 | Sinh câu hỏi cho JD/CV; AI trả đầu ra lỗi, rỗng, lỗi provider hoặc timeout. | Kết quả có category/difficulty theo schema; lỗi có fallback/hiển thị; không làm hỏng lịch. |
| INT-05 | P0 | Ứng viên xác nhận, từ chối hoặc yêu cầu đổi lịch qua link/ID; thử xác nhận lặp và ID đoán được. | Trạng thái xác nhận hợp lệ; hành động ngoài trạng thái được phép bị từ chối; token/ID không mở quyền HR ngoài dự kiến. |
| INT-06 | P1 | Phân loại phản hồi email ứng viên (positive/negative/reschedule/không xác định), nội dung injection. | Phân loại đúng schema; nội dung ứng viên không được coi là chỉ thị hệ thống; độ tin cậy/unknown được xử lý an toàn. |
| INT-07 | P1 | Gửi thư mời từ interview; kiểm tra template và thông tin cá nhân hóa. | Tên, job, giờ, timezone/link đúng; email log gắn đối tượng; lỗi SMTP được ghi nhận và không báo thành công giả. |
| INT-08 | P1 | UI `/interviews`, SchedulePicker, đề xuất câu hỏi: tạo, lọc, xác nhận, loading và lỗi API. | Dữ liệu hiển thị đúng múi giờ; nút không gửi lặp; người dùng nhận lỗi cụ thể. |

### E. Đánh giá, consent và xử lý âm thanh

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| EVAL-01 | P0 | Interviewer nhập rubric/manual evaluation hợp lệ, sau đó cập nhật; đọc consolidated report. | Điểm/nhận xét lưu đúng interview/application; report hợp nhất phản ánh đánh giá người và AI rõ nguồn. |
| EVAL-02 | P0 | Gửi điểm thiếu/sai miền, rubric rỗng, interview không tồn tại hoặc ngoài tenant. | Lỗi 4xx; không tạo đánh giá sai hoặc cho xem đánh giá tenant khác. |
| EVAL-03 | P0 | Upload audio khi consent false/thiếu; sau đó true và audio hợp lệ. | Không consent thì tuyệt đối không enqueue/transcribe; có consent mới xử lý và consent được lưu/truy vết. |
| EVAL-04 | P0 | Upload audio sai định dạng/rỗng/quá lớn; STT lỗi/timeout; gửi lại cùng yêu cầu. | Từ chối file lỗi; lỗi provider không mất evaluation; retry/idempotency tránh nhân đôi transcript/task không cần thiết. |
| EVAL-05 | P1 | Kiểm tra transcript có nhiều speaker, timestamp đầu/cuối, nội dung Unicode và audio không lời. | Segment theo schema, timestamp tăng và nằm trong thời lượng; xử lý empty transcript có trạng thái xác định. |
| EVAL-06 | P1 | UI `/evaluations` và TranscriptViewer: chọn interview, upload, xem tiến độ, speaker/time, report. | UI thể hiện consent bắt buộc; tải lỗi có hướng dẫn; transcript dễ đọc, timestamp đúng, không treo khi worker thất bại. |

### F. Email hàng loạt

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| MAIL-01 | P0 | Preview email loại invitation/offer/rejection với ứng viên hợp lệ và dữ liệu thiếu. | Preview cá nhân hóa đúng, escape HTML; template/loại không hỗ trợ bị từ chối. |
| MAIL-02 | P0 | Gửi một batch nhiều ứng viên qua mock; xem email logs. | Task nhận đúng người nhận, trạng thái từng email được ghi; kết quả async quan sát được. |
| MAIL-03 | P0 | Gửi lặp cùng email type cho cùng candidate/application trong cùng chu kỳ; gửi song song hai request. | Chống trùng có tính nguyên tử/idempotent; chỉ một thư được gửi hoặc thư còn lại được đánh dấu bỏ qua. |
| MAIL-04 | P1 | Trộn địa chỉ sai, người nhận trùng, một lần gửi thất bại giữa batch. | Lỗi từng người không làm sai trạng thái của toàn batch; retry không gửi lại thành công đã ghi. |
| MAIL-05 | P1 | Query email logs có phân trang/lọc và thử tenant khác. | Log theo quyền; nội dung/token tracking nhạy cảm không bị lộ không cần thiết. |
| MAIL-06 | P1 | UI preview/send, xác nhận trước khi gửi, network timeout sau khi server nhận request. | Preview khớp thư gửi; không gửi lặp khi retry; trạng thái pending/success/failure rõ ràng. |

### G. AI, embeddings và worker

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| AI-01 | P0 | Chạy LLM mock cho parse CV, match CV, generate questions, evaluation, classify response. | Output parse theo Pydantic schema; điểm trong 0–100; có explanation/breakdown; không throw với đầu vào tối thiểu hợp lệ. |
| AI-02 | P1 | Mock provider trả JSON hỏng, thiếu field, điểm ngoài miền, output rất dài, timeout/rate limit. | Validate/repair/retry/fallback có giới hạn; lỗi an toàn; không ghi kết quả sai như kết quả đáng tin cậy. |
| AI-03 | P1 | Cấu hình provider thật thiếu/sai API key hoặc provider không khả dụng. | Khởi động hoặc thao tác báo lỗi cấu hình rõ; không log key; mock không gọi mạng ngoài. |
| AI-04 | P1 | Embedding văn bản rỗng, tiếng Việt/Unicode, văn bản dài; kiểm tra chiều và similarity vector khác chiều. | Vector đúng chiều provider/cấu hình; similarity hữu hạn và trong miền; vector khác chiều bị xử lý có kiểm soát. |
| AI-05 | P0 | Cho CV chứa prompt injection hoặc thuộc tính nhạy cảm; đánh giá score/explanation. | AI chỉ đánh giá tiêu chí công việc; nội dung CV không ghi đè system instruction; người HR giữ quyền quyết định cuối. |
| WORK-01 | P0 | Worker chấm CV, phân tích audio, gửi batch thành công và thất bại; dừng Redis rồi khởi động lại. | Trạng thái task được ghi; task lỗi quan sát được/retry có giới hạn; task không mất dữ liệu nghiệp vụ. |
| WORK-02 | P1 | Gửi cùng task ID/job hai lần hoặc worker restart khi đang chạy. | Task idempotent hoặc có cơ chế chống cập nhật/gửi trùng; trạng thái cuối không bị lùi. |

### H. Báo cáo, UI chung và khả năng sử dụng

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| UI-01 | P1 | Duyệt toàn bộ route dashboard: `/`, `/jobs`, `/candidates`, `/candidates/[id]`, `/pipeline`, `/interviews`, `/evaluations`, `/reports`, `/requests`, `/talent-pool`. | Không lỗi render/console nghiêm trọng; menu và điều hướng đúng; route yêu cầu auth được bảo vệ phù hợp. |
| UI-02 | P1 | Kiểm tra mọi trang ở trạng thái loading, danh sách rỗng, API 401/403/500, dữ liệu lớn. | Có thông báo và hành động tiếp theo; layout không vỡ; không hiển thị dữ liệu cũ như mới. |
| UI-03 | P2 | Thử viewport mobile/tablet/desktop, bàn phím, focus modal, label form, tương phản cơ bản. | Các luồng chính thao tác được; modal đóng/mở đúng; trường lỗi được đọc/nhận biết. |
| REP-01 | P1 | So sánh funnel, số lượng theo pipeline và time-to-hire với dữ liệu mẫu có ngày biên/timezone. | Số liệu khớp truy vấn chuẩn; không đếm chéo tenant/trùng application; khoảng ngày rõ ràng. |

### I. API, dữ liệu, bảo mật và triển khai

| ID | Mức | Kịch bản và bước chính | Kết quả mong đợi |
|---|---|---|---|
| SEC-01 | P0 | Gửi HTML/script trong tên, ghi chú, JD, chat, email template; mở lại trên UI. | Không XSS; nội dung được encode/escape; server không tin HTML do người dùng gửi. |
| SEC-02 | P0 | Thử path traversal, MIME spoofing, upload executable, truy cập storage URL không có quyền. | Chỉ cho phép phạm vi/loại được hỗ trợ; URL không vượt thư mục; dữ liệu ứng viên không công khai ngoài thiết kế. |
| SEC-03 | P0 | Kiểm tra CORS từ origin cho phép và không cho phép; method/header; cookies/credentials. | Chỉ origin cần thiết được phép; không kết hợp wildcard origin với credentials. |
| SEC-04 | P1 | Gửi payload lớn, query quá dài, request burst, SQL-like strings và UUID sai. | Có giới hạn/validation; không crash; truy vấn dùng bind parameter; lỗi không lộ stack trace. |
| DATA-01 | P0 | Tạo/sửa/xóa liên kết các thực thể; kiểm tra FK và chính sách cascade/SET NULL. | Không có orphan ngoài chủ ý; xóa dữ liệu tuân đúng retention/chính sách. |
| DATA-02 | P1 | Thử hai request cập nhật cùng bản ghi và ứng tuyển/email trùng đồng thời. | Ràng buộc DB bảo vệ invariant; transaction rollback đầy đủ khi một bước lỗi. |
| DEP-01 | P0 | Build frontend production và khởi chạy image Docker Compose sạch với `.env.example` đã cấu hình. | Frontend/API/DB/Redis/worker healthy; route proxy chạy; không phụ thuộc thư mục làm việc sai. |
| DEP-02 | P1 | Khởi động backend khi DB/Redis chưa sẵn sàng, provider thiếu key; restart từng service. | Dependency fail được báo rõ; health/readiness phản ánh khả năng thật; restart không tạo dữ liệu/schema bất nhất. |
| DEP-03 | P1 | Kiểm tra log/container/static storage/secret config trong môi trường staging. | Không xuất secret/token/PII không cần thiết; storage tồn tại và có quyền tối thiểu. |

## 5. Luồng kiểm thử đầu-cuối bắt buộc (P0)

### E2E-01: Từ tin đăng tới ứng tuyển

1. HR-A đăng nhập và tạo JD draft.
2. Xác minh tin chưa hiện công khai và ứng viên không thể nộp.
3. Publish JD; tìm ở trang việc làm, mở slug.
4. Nộp CV PDF hợp lệ, theo dõi parse/matching và xác minh điểm/breakdown.
5. HR-A xem ứng viên, cập nhật pipeline; HR-B không thể truy cập hồ sơ.

**Đạt khi:** dữ liệu liên kết xuyên suốt đúng công ty/JD, không có bản ghi trùng hoặc tệp mồ côi.

### E2E-02: Phỏng vấn tới kết quả

1. HR lên lịch interview online/offline; chặn lịch interviewer bị overlap.
2. Sinh câu hỏi AI, gửi thư mời qua email sandbox; ứng viên xác nhận.
3. Interviewer nhập rubric; upload audio chỉ sau consent; worker sinh transcript.
4. Mở consolidated report và đổi pipeline sang bước tiếp theo.

**Đạt khi:** múi giờ, trạng thái, consent, transcript và report thống nhất; lỗi provider không xóa đánh giá thủ công.

### E2E-03: Offer/rejection và chống gửi trùng

1. HR preview offer/rejection cho candidate; kiểm tra cá nhân hóa.
2. Gửi batch qua mock, đọc trạng thái log.
3. Gửi lại request và gửi song song cùng loại/candidate.

**Đạt khi:** email log chính xác; email cùng loại trong cùng chu kỳ chỉ phát hành một lần.

## 6. Ưu tiên và tiêu chí nghiệm thu

- **P0:** bảo mật/tenant, đăng nhập, vòng đời JD, ứng tuyển và tệp, pipeline, lịch không trùng, consent âm thanh, chống gửi email trùng, các luồng E2E. Không được có lỗi P0 trước nghiệm thu.
- **P1:** nhánh provider lỗi, talent pool, phân loại email, báo cáo, UI lỗi/empty, migration/worker/restart và kiểm tra responsive cơ bản.
- **P2:** khả năng tiếp cận nâng cao, tải lớn và tối ưu hiệu năng chi tiết.
- Với mọi P0/P1: lưu request/response đã loại bỏ PII, log task ID, ảnh chụp UI cần thiết và truy vấn xác minh DB; không lưu CV/audio thật vào báo cáo.
- Nghiệm thu: tất cả P0 đạt; không có lỗi dữ liệu hoặc cô lập tenant; lỗi provider/hạ tầng được báo đúng; tất cả P1 đã chạy hoặc có lý do hoãn được ghi nhận.

## 7. Đối chiếu với kiểm thử hiện có và lưu ý

Trong mã hiện có, pytest tập trung vào auth, tạo/publish JD, nộp hồ sơ/matching/pipeline/feedback và một số năng lực AI mock (`api/tests/`). Các script `api/test_*.py`, `api/verify_*.py`, `api/run_production_tests.py` bổ sung kiểm thử thủ công/tích hợp về avatar, luồng người dùng, email/phỏng vấn và AI. `test_results.md` ghi báo cáo lịch sử ngày 27/09/2026 với các kết quả đạt; tài liệu này **không xác minh lại** các con số đó trên trạng thái mã hiện tại.

Phần còn cần ưu tiên tự động hóa: RBAC và tenant trên mọi route; interview overlap/confirm; rubric/audio consent; email idempotency trong điều kiện đồng thời; talent pool/search; contract giữa frontend và API; validation upload; lỗi/timeout provider; task retry/idempotency; migration clean-install/upgrade. `package.json` hiện có build và lint nhưng không khai báo bộ test frontend/E2E; cân nhắc bổ sung sau khi thống nhất framework và môi trường CI.

**Giới hạn khảo sát:** `AGENTS.md` chỉ dẫn dùng skill `codebase-memory`, nhưng skill/tool đó không khả dụng trong phiên này; cấu trúc được khảo sát trực tiếp qua cây file, route, client, test và cấu hình. Dự án có database dump lớn (`database/init.sql`) và tệp tài liệu PDF/DOCX; nội dung dump không được dùng làm danh sách case và tài liệu này ưu tiên kiểm chứng hành vi theo mã nguồn.
