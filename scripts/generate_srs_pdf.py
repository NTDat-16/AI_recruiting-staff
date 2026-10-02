import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AI RECRUITING PLATFORM & ATS CORE — ARCHITECTURE BLUEPRINT & SRS")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
        # Footer
        page_text = f"Trang {self._pageNumber} / {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — ANTIGRAVITY AI RECRUITING CORE 2026")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()


def generate_srs_pdf(output_path: str):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=60,
        bottomMargin=60,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#4338ca")
    slate_dark = colors.HexColor("#0f172a")
    slate_muted = colors.HexColor("#475569")
    emerald_color = colors.HexColor("#059669")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_color,
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=slate_muted,
        alignment=0,
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=slate_dark,
        spaceBefore=14,
        spaceAfter=6,
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=slate_dark,
        spaceAfter=4,
    )
    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3,
    )
    callout_style = ParagraphStyle(
        "Callout_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
    )

    elements = []

    # Title Banner
    elements.append(Paragraph("AI RECRUITING PLATFORM &amp; ATS CORE", title_style))
    elements.append(Spacer(1, 4))
    elements.append(
        Paragraph("SOFTWARE REQUIREMENT SPECIFICATION (SRS) &amp; ARCHITECTURE BLUEPRINT", subtitle_style)
    )
    elements.append(Spacer(1, 8))

    meta_table = Table(
        [
            [
                Paragraph("<b>Version:</b> 2.4.0-PROD", body_style),
                Paragraph("<b>Date:</b> October 2026", body_style),
                Paragraph("<b>Target Agent:</b> Antigravity AI Engineer", body_style),
                Paragraph("<b>Classification:</b> Production Ready", body_style),
            ]
        ],
        colWidths=[110, 110, 160, 124],
    )
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # 1. System Architecture & Topology
    elements.append(Paragraph("1. SYSTEM ARCHITECTURE &amp; TOPOLOGY", h1_style))
    elements.append(
        Paragraph(
            "He thong duoc kien truc theo mo hinh phan lop hien dai (Clean Multi-tier Architecture) tach biet ro rang giua cong khai va noi bo:",
            body_style,
        )
    )

    arch_data = [
        [
            Paragraph("<b>Phan He</b>", body_style),
            Paragraph("<b>Pham Vi &amp; Cac Tinh Nang Chinh</b>", body_style),
            Paragraph("<b>Doi Tuong Su Dung</b>", body_style),
        ],
        [
            Paragraph("<b>Employer Portal</b><br/>(Cong Nha Tuyen Dung)", body_style),
            Paragraph(
                "• Dashboard KPI &amp; Tong quan phau tuyen dung theo thoi gian thuc.<br/>"
                "• Quan ly Tin tuyen dung (Job Postings) &amp; Thiet lap trong so AI.<br/>"
                "• Pipeline Kanban truc quan quan ly 7 giai doan ung vien.<br/>"
                "• Quan ly lich phong van, phong hop video truc tuyen.<br/>"
                "• Scorecard &amp; Rubric Analyzer danh gia sau phong van.<br/>"
                "• Kho Nhan Tai (Talent Pool) &amp; Semantic Rediscovery.",
                body_style,
            ),
            Paragraph("HR Manager, Recruiter, Interviewer, Hiring Board", body_style),
        ],
        [
            Paragraph("<b>Candidate Portal</b><br/>(Cong Tuyen Dung Cong Khai)", body_style),
            Paragraph(
                "• Danh sach vi tri viec lam mo tuyen (/careers, /jobs/public).<br/>"
                "• Quick Apply khong bat buoc tao tai khoan, AI CV parsing tu dong.<br/>"
                "• Tra cuu trang thai ho so ung tuyen minh bach (/careers/track).<br/>"
                "• Chatbot AI Career Copilot tu van 24/7.",
                body_style,
            ),
            Paragraph("Ung vien dai chung, Nguoi tim viec", body_style),
        ],
        [
            Paragraph("<b>Recruitment Core / ATS</b>", body_style),
            Paragraph(
                "• Quan tri thuc the ung vien toan dien (Candidate 360).<br/>"
                "• Pipeline Stages (new -> reviewing -> interview -> offer -> hired).<br/>"
                "• Luu tru tai lieu CV, trich xuat vector embedding, nhat ky kiem toan.",
                body_style,
            ),
            Paragraph("Backend Engine &amp; Database Layer", body_style),
        ],
        [
            Paragraph("<b>AI Layer (Gemini)</b>", body_style),
            Paragraph(
                "• CV Parser: Trich xuat hoc van, ky nang, kinh nghiem sang JSON.<br/>"
                "• Candidate-Job Matching: So khop ngu nghia, giai thich Strong/Gap.<br/>"
                "• Interview Question Generator: Goi y cau hoi phong van STAR.<br/>"
                "• Transcript Rubric Analyzer: Danh gia ghi am theo tieu chi.<br/>"
                "• Talent Rediscovery: Tim kiem va tai su dung ung vien tu Talent Pool.",
                body_style,
            ),
            Paragraph("Google Gemini API &amp; LLM Orchestrator", body_style),
        ],
    ]
    arch_table = Table(arch_data, colWidths=[120, 274, 110])
    arch_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ede9fe")),
                ("TEXTCOLOR", (0, 0), (-1, 0), primary_color),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(arch_table)
    elements.append(Spacer(1, 10))

    # 2. Core Principle: Candidate Profile Independent of Application
    elements.append(Paragraph("2. CORE PRINCIPLE: CANDIDATE PROFILE INDEPENDENT OF APPLICATION", h1_style))
    elements.append(
        Paragraph(
            "<b>Nguyen tac bat bien cua kien truc ATS hien dai:</b> Candidate Profile la mot thuc the doc lap duy nhat luu tru thong tin con nguoi (Ho ten, email, sdt, hoc van, ky nang, kinh nghiem, file goc). Moi lan nop ho so cho mot Job cu the se tao ra mot thuc the <b>Job Application</b> lien ket voi Candidate do.",
            body_style,
        )
    )
    elements.append(
        Paragraph(
            "• <b>Chong trung lap (Deduplication):</b> Khi ung vien da co trong he thong nop vao Job khac, he thong tu dong nhan dien email de tai su dung Profile, tao ban ghi Application moi, khong lam roi loan du lieu.<br/>"
            "• <b>Kich hoat AI Talent Rediscovery:</b> Khi doanh nghiep mo Job moi, HR co the dung bo tim kiem ngu nghia de quet toan bo Kho Nhan Tai va tai ket noi (Rediscover) ung vien phu hop vao Job moi ma khong can dang bai tuyen dung lai tu dau.",
            bullet_style,
        )
    )
    elements.append(Spacer(1, 10))

    # 3. Separation of Concerns
    elements.append(Paragraph("3. SEPARATION OF CONCERNS (PHAN TACH TRẠCH NHIEM)", h1_style))
    soc_data = [
        [
            Paragraph("<b>Phan He</b>", body_style),
            Paragraph("<b>Trach Nhiem Chuyen Biet</b>", body_style),
            Paragraph("<b>Ranh Gioi Kien Truc</b>", body_style),
        ],
        [
            Paragraph("<b>Workflow Engine</b>", body_style),
            Paragraph("Dieu phoi trang thai pipeline (Applied -> Reviewing -> Interview -> Offer -> Hired/Rejected). Dong bo lich hen va thong bao.", body_style),
            Paragraph("FastAPI State Machine &amp; Celery Workers", body_style),
        ],
        [
            Paragraph("<b>Rule Engine</b>", body_style),
            Paragraph("Kiem tra quy tac dinh luong cung: muc luong vuot tran ngan sach, bat buoc hoan thanh phong van va co scorecard truoc khi phat hanh thu moi offer.", body_style),
            Paragraph("Deterministic Business Logic (Python Services)", body_style),
        ],
        [
            Paragraph("<b>AI Copilot</b>", body_style),
            Paragraph("Doc hieu ngu nghia ngon ngu tu nhien, trich xuat CV, cham diem doi sanh JD, phan tich noi dung bóc bang phong van. Chi dong vai tro co van, khong ra quyet dinh thay con nguoi.", body_style),
            Paragraph("Gemini LLM Client with Schema Validation", body_style),
        ],
    ]
    soc_table = Table(soc_data, colWidths=[110, 274, 120])
    soc_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(soc_table)
    elements.append(Spacer(1, 10))

    # 4. Ethical AI Guardrails
    elements.append(Paragraph("4. ETHICAL AI GUARDRAILS (RAO CHAN DAO DUC AI)", h1_style))
    guardrails_box = [
        [
            Paragraph(
                "<b>QUY TAC DAO DUC BAT DI BAT DICH CUA NEN TANG:</b><br/>"
                "1. <b>KHONG</b> su dung AI nhan dien khuon mat hoac cham diem cam xuc/thai do cua ung vien.<br/>"
                "2. <b>KHONG</b> phan tich am sac giong noi de suy dien tinh cach hay tam ly.<br/>"
                "3. <b>KHONG</b> tu dong loai ho so (Auto-reject) ma khong co su xem xet va phe duyet truc tiep cua chuyen vien HR (Human-in-the-loop).<br/>"
                "4. <b>KHONG</b> dua ra diem so mu mo: Moi diem tuong thich deu phai di kem giai thich cu the cac diem khop manh (Strong Matches) va cac diem con thieu hut (Missing Evidence).",
                callout_style,
            )
        ]
    ]
    g_table = Table(guardrails_box, colWidths=[504])
    g_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#f87171")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    elements.append(g_table)
    elements.append(Spacer(1, 12))

    # 5. Engineering Task Checklist
    elements.append(Paragraph("5. ANTIGRAVITY ENGINEERING TASK CHECKLIST (100% COMPLETE)", h1_style))
    checklist_data = [
        [
            Paragraph("<b>Trang Thai</b>", body_style),
            Paragraph("<b>Hang Muc Tinh Nang Theo Dac Ta SRS</b>", body_style),
            Paragraph("<b>Vi Tri Codebase / Endpoint</b>", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Dual Portals:</b> Tach biet tuyet doi Cong Nha Tuyen Dung va Cong Tuyen Dung Cong Khai", body_style),
            Paragraph("components/layout/AppHeader.tsx, app/careers", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Quick Apply &amp; AI CV Parser:</b> Nop ho so khong can dang ky tai khoan, tu dong boc tach CV", body_style),
            Paragraph("POST /api/v1/candidates/apply, app/(public)/apply", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Candidate Status Tracking:</b> Tra cuu trang thai ho so truc tuyen theo email minh bach", body_style),
            Paragraph("GET /api/v1/candidates/track/status, /careers/track", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>24/7 AI Career Chatbot:</b> Tro ly ao ho tro ung vien tim viec va giai dap quy trinh", body_style),
            Paragraph("POST /api/v1/candidates/career-chat, CareerChatWidget.tsx", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Configurable Kanban Pipeline:</b> Dieu phoi 7 trang thai ung vien truc quan", body_style),
            Paragraph("PATCH /candidates/applications/.../pipeline-status", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Interview &amp; Transcript Rubric:</b> Quan ly phong hop truc tuyen va danh gia transcript", body_style),
            Paragraph("app/(dashboard)/interviews, /evaluations", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Talent Pool &amp; AI Rediscovery:</b> Tim kiem ngu nghia va tai ket noi ung vien vao Job moi", body_style),
            Paragraph("POST /candidates/{id}/rediscover, /talent-pool", body_style),
        ],
        [
            Paragraph("<font color='#059669'><b>[x] HOAN TAT</b></font>", body_style),
            Paragraph("<b>Export SRS PDF:</b> Xuat tai lieu ban dac ta ky thuat truc tiep phuc vu ban giao", body_style),
            Paragraph("scripts/generate_srs_pdf.py, public/AI_RECRUITING_SRS...", body_style),
        ],
    ]
    cl_table = Table(checklist_data, colWidths=[90, 254, 160])
    cl_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(cl_table)
    elements.append(Spacer(1, 14))

    # Sign-off footer
    elements.append(
        Paragraph(
            "<b>XAC NHAN BAN GIAO KY THUAT (ENGINEERING HANDOFF SIGN-OFF):</b><br/>"
            "Tai lieu va toan bo ma nguon he thong da duoc kiem thu chat che voi Neon PostgreSQL, Next.js 15, FastAPI va Google Gemini AI. San pham san sang trien khai van hanh Production.",
            callout_style,
        )
    )

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"SRS PDF successfully generated at: {output_path}")


if __name__ == "__main__":
    out = "public/AI_RECRUITING_SRS_SPECIFICATION_v2.4.0.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    generate_srs_pdf(out)
