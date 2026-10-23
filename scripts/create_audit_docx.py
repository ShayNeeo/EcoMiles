import os
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    """
    kwargs can be top, bottom, left, right.
    val: 'single', 'double', 'dashed', etc.
    color: 'auto' or hex code
    sz: size in 1/8 pt
    """
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), edge_data.get('color', 'auto'))
            tcBorders.append(element)
    tcPr.append(tcBorders)

def add_callout(doc, text_runs, bg_hex="F1F5F9", border_color="059669"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    set_cell_border(cell, left={'val': 'single', 'sz': 24, 'color': border_color})
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.2
    for r_text, r_bold, r_color, r_size in text_runs:
        run = p.add_run(r_text)
        run.bold = r_bold
        if r_color:
            run.font.color.rgb = r_color
        if r_size:
            run.font.size = Pt(r_size)
    
    # Add small spacing after table
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(0)
    sp.paragraph_format.space_after = Pt(4)

def style_heading(p, text, level=1):
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    if level == 1:
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Dark Navy
    elif level == 2:
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x03, 0x69, 0xA1) # Deep Blue
    elif level == 3:
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55) # Slate

def main():
    root = Path(__file__).resolve().parent.parent
    out_docx_audit = root / "docs" / "audit" / "PROPOSAL_ECOMILES_TECH_AUDIT.docx"
    out_docx_root = root / "BAO_CAO_AUDIT_TECH_SLIDE_ECOMILES.docx"

    doc = Document()

    # Page Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base Normal Style
    normal = doc.styles['Normal']
    normal.font.name = 'Arial'
    normal.font.size = Pt(10)
    normal.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B) # Slate-800
    normal.paragraph_format.line_spacing = 1.25
    normal.paragraph_format.space_after = Pt(5)

    # ---------------------------------------------------------
    # HEADER / TITLE
    # ---------------------------------------------------------
    tp = doc.add_paragraph()
    tp.paragraph_format.space_before = Pt(0)
    tp.paragraph_format.space_after = Pt(2)
    r_sub = tp.add_run("BÁO CÁO ĐÁNH GIÁ CHUYÊN SÂU NĂNG LỰC KỸ THUẬT & ĐỐI THỦ CẠNH TRANH\n")
    r_sub.font.size = Pt(10)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Emerald Green

    r_title = tp.add_run("AUDIT PROPOSAL SLIDES: ECOMILES PITCH DECK\nĐỐI CHIẾU NĂNG LỰC CODEBASE & MA TRẬN KHÁC BIỆT")
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    add_callout(doc, [
        ("• Tài liệu phân tích: ", True, RGBColor(0x0F, 0x17, 0x2A), 10),
        ("Proposal _ ECOMILES.pdf (14 Trang Slide, Định dạng Canva 1440x810, Xuất bản 2026)\n", False, None, 10),
        ("• Mục tiêu thẩm định: ", True, RGBColor(0x0F, 0x17, 0x2A), 10),
        ("Kiểm tra xem slide đã phản ánh đúng công nghệ lõi (Core Tech) và thế mạnh công nghệ thực sự vượt trội so với các đối thủ (Abivin, SmartLog, AhaMove, Google Maps) hay chưa; chỉ ra các lỗ hổng rủi ro dữ liệu khi đối mặt BGK cuộc thi khởi nghiệp (VSIC / SO2026 / RnD to Startup) và cung cấp kịch bản sửa đổi chi tiết.", False, None, 10)
    ], bg_hex="F8FAFC", border_color="0284C7")

    # ---------------------------------------------------------
    # SECTION 1: KẾT LUẬN TỔNG QUAN (EXECUTIVE SUMMARY)
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "1. KẾT LUẬN TỔNG QUAN & PHÁN QUYẾT CỐT LÕI", level=1)

    add_callout(doc, [
        ("CÂU HỎI 1: BẢN SLIDE ĐÃ PHẢN ÁNH ĐÚNG NĂNG LỰC CÔNG NGHỆ LÕI (CORE TECH) CHƯA?\n", True, RGBColor(0xDC, 0x26, 0x26), 11),
        ("=> PHÁN QUYẾT: CHƯA (HOÀN TOÀN DƯỚI TẦM / SEVERELY UNDERSELLS).\n", True, RGBColor(0xDC, 0x26, 0x26), 10.5),
        ("Bản slide hiện tại mô tả EcoMiles bằng những từ ngữ rất phổ thông và cơ bản như 'Thuật toán VRP gom cụm 3-5 giây', 'Bản đồ OSRM đường bộ thực tế', 'Đo CO₂ dựa trên km theo GLEC'. Cách viết này khiến dự án trông giống hệt một bài tập lớn hoặc đồ án tốt nghiệp của sinh viên tải thư viện mã nguồn mở có sẵn về chạy, che giấu hoàn toàn các bước đột phá công nghệ sâu (Deep Tech) đã được lập trình và kiểm chứng chặt chẽ trong mã nguồn của hệ thống.\n\n", False, None, 10),
        ("CÂU HỎI 2: ĐÃ CHỈ RA ĐƯỢC CHÚNG TA THỰC SỰ TIÊN TIẾN HƠN CÁC ĐỐI THỦ CHƯA?\n", True, RGBColor(0xD9, 0x77, 0x06), 11),
        ("=> PHÁN QUYẾT: CHƯA (THIẾU SÓT CHIẾN LƯỢC NGHIÊM TRỌNG).\n", True, RGBColor(0xD9, 0x77, 0x06), 10.5),
        ("Slide 8 ('Lợi thế cạnh tranh') chỉ so sánh duy nhất với 'Cách làm cũ (Thủ công trên Excel / ERP truyền thống)'. Đây là lỗi sơ đẳng nhất khi đi gọi vốn hoặc thi khởi nghiệp. Bất kỳ giám khảo hay nhà đầu tư nào cũng sẽ chất vấn ngay: 'Tại sao không so sánh với Abivin vRoute (quán quân Startup World Cup)? SmartLog (STM)? AhaMove / OnWheel? Hay Google Fleet Engine?'. Việc né tránh các đối thủ thực tế khiến đội thi bị đánh giá là chưa nghiên cứu thị trường.", False, None, 10)
    ], bg_hex="FEF2F2", border_color="DC2626")

    # ---------------------------------------------------------
    # SECTION 2: AUDIT THỊ GIÁC & CHI TIẾT TỪNG TRANG SLIDE (1-14)
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "2. ĐÁNH GIÁ THỊ GIÁC & NỘI DUNG TỪNG TRANG SLIDE (VISION AUDIT)", level=1)

    p_tbl_intro = doc.add_paragraph("Dưới đây là bảng rà soát chi tiết qua 14 trang slide từ ảnh render chất lượng cao (150 DPI) trích xuất từ file PDF gốc:")
    p_tbl_intro.paragraph_format.space_after = Pt(6)

    audit_table = doc.add_table(rows=1, cols=4)
    audit_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    audit_table.autofit = False

    # Header Row
    hdr_cells = audit_table.rows[0].cells
    headers = [("Slide", Inches(0.6)), ("Tiêu đề & Nội dung chính", Inches(2.0)), ("Đánh giá kỹ thuật & Rủi ro", Inches(3.0)), ("Mức rủi ro", Inches(0.9))]
    for i, (h_text, w) in enumerate(headers):
        hdr_cells[i].width = w
        set_cell_background(hdr_cells[i], "0F172A")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h_text)
        run.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    slide_audits = [
        ("01", "Cover: Tối ưu vận chuyển, tiết kiệm chi phí, kiến tạo tương lai xanh", "Hình ảnh xe tải tối màu hiện đại, nổi bật logo EcoMiles. Dẫn link demo trực tiếp ecomiles.pages.dev.", "An toàn"),
        ("02", "Tổng quan: Đội thi liên ngành, 80 đơn/10 xe, GLEC & ISO 14064", "RỦI RO: Số '142.8 kg CO₂' và 'triệt tiêu 30% xe rỗng' không có nhãn trạng thái dữ liệu. Dẫn sai chuẩn ISO 14064 (vốn cho tổ chức, vận tải phải là ISO 14083).", "CAO"),
        ("03", "Vấn đề: Nghịch lý kép logistics (17% GDP, 80% CO₂ đường bộ, 30-35% rỗng)", "Số liệu vĩ mô ấn tượng. Thiếu phân tích nguyên nhân gốc rễ (5 Whys) và câu chuyện người trong cuộc (Persona) theo tiêu chuẩn VSIC.", "Trung bình"),
        ("04", "Đội ngũ sáng lập: 5 thành viên đa ngành (FPT, IU, FTU2, NEU)", "Cơ cấu vai trò rõ ràng, có phân công CTO phụ trách AI & OSRM.", "An toàn"),
        ("05", "Ý nghĩa & Tầm nhìn: COP26, NĐ 06/2022/NĐ-CP, 34.000+ SME", "Tuyên bố '100% tuân thủ NĐ 06' dễ bị bắt bẻ vì phần mềm là công cụ tự kiểm kê nội bộ, không thay thế cơ quan kiểm toán KNK độc lập.", "Trung bình"),
        ("06", "Giải pháp lõi: 4 cách EcoMiles giúp vận hành", "NGHIÊM TRỌNG: Gọi thuật toán là 'Smart VRP 3-5s' và 'Bản đồ OSRM'. Không nêu được ALNS, mô hình vật lý và Pareto SLA. Nhận 'Ghép đơn chiều về' dù tính năng này nằm ở Roadmap GĐ 4.", "CỰC CAO"),
        ("07", "Sản phẩm thực tế: Giao diện điều hành & App tài xế", "Ảnh chụp màn hình thật rất thuyết phục. Nhưng nhãn '-88.31% CO₂' là so sánh với lộ trình chạy lộn xộn (zig-zag giả lập), cần ghi rõ nhãn mô phỏng benchmark.", "CAO"),
        ("08", "Lợi thế cạnh tranh: So sánh với cách làm cũ (Excel / ERP)", "NGHIÊM TRỌNG: Hoàn toàn không nhắc tới các đối thủ trực tiếp trên thị trường (Abivin, SmartLog, AhaMove, Google Maps). Tạo cảm giác ngây thơ về thị trường.", "CỰC CAO"),
        ("09", "Lộ trình phát triển: 2026 - 2032+ (MVP đến Xuyên biên giới)", "Lộ trình rõ ràng theo từng giai đoạn, nhưng thiếu các mốc kỹ thuật cụ thể (Telemetry hiệu chuẩn, IoT CAN-bus, PostGIS).", "Thấp"),
        ("10", "Ngân sách ban đầu: 228,6 triệu VNĐ (42.4% Tech, 37.3% Thiết bị)", "Ngân sách tinh gọn, phân bổ hợp lý cho giai đoạn hạt giống cuộc thi sinh viên.", "Thấp"),
        ("11", "Cơ cấu nguồn thu: 5 nguồn (SaaS 1.5-40M, Tích hợp, Tư vấn ESG...)", "Chưa gắn kết dòng tiền với dòng tác động xã hội (Impact-driven model). Tính phí ghép đơn chiều về khi tính năng chưa chạy.", "Trung bình"),
        ("12", "Tính khả thi: Hoàn vốn 1.68 năm, IRR 28%, NPV 185.5M, Pilot 3-5 DN", "Các chỉ số tài chính được tính toán bài bản. Cam kết pilot 3-5 DN và 30-100 xe rất sát thực tế.", "An toàn"),
        ("13", "Tác động ESG: Giảm 20-30% CO₂, Tăng 15-20% thu nhập tài xế", "Thông điệp tốt. Cần gắn nhãn [GIẢ ĐỊNH – CẦN PILOT] cho con số 20-30% để tránh bị vặn hỏi nguồn kiểm chứng.", "Trung bình"),
        ("14", "Thank You: Demo trực tiếp ecomiles.pages.dev & thông tin đội thi", "Trang kết thúc sạch sẽ, có link trải nghiệm thực tế.", "An toàn")
    ]

    for s_id, s_title, s_eval, s_risk in slide_audits:
        row = audit_table.add_row()
        cells = row.cells
        cells[0].width = Inches(0.6)
        cells[1].width = Inches(2.0)
        cells[2].width = Inches(3.0)
        cells[3].width = Inches(0.9)

        cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_id = cells[0].paragraphs[0].add_run(s_id)
        r_id.bold = True

        cells[1].paragraphs[0].add_run(s_title)
        cells[2].paragraphs[0].add_run(s_eval)

        p_r = cells[3].paragraphs[0]
        p_r.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_risk = p_r.add_run(s_risk)
        r_risk.bold = True
        
        # Color tag
        if s_risk == "CỰC CAO":
            set_cell_background(cells[3], "FEE2E2")
            r_risk.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B)
        elif s_risk == "CAO":
            set_cell_background(cells[3], "FFEDD5")
            r_risk.font.color.rgb = RGBColor(0x9A, 0x34, 0x12)
        elif s_risk == "Trung bình":
            set_cell_background(cells[3], "FEF9C3")
            r_risk.font.color.rgb = RGBColor(0x85, 0x4D, 0x0E)
        else:
            set_cell_background(cells[3], "DCFCE7")
            r_risk.font.color.rgb = RGBColor(0x16, 0x65, 0x34)

        for c in cells:
            set_cell_margins(c, top=80, bottom=80, left=90, right=90)
            set_cell_border(c, bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'})

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ---------------------------------------------------------
    # SECTION 3: ĐỐI CHIẾU NĂNG LỰC: SLIDE TUYÊN BỐ VS. CODEBASE THỰC TẾ
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "3. ĐỐI CHIẾU NĂNG LỰC: SLIDE TUYÊN BỐ VS. THỰC TẾ CODEBASE", level=1)

    p_c1 = doc.add_paragraph(
        "Mã nguồn hiện tại của EcoMiles đã đạt độ hoàn thiện cao với 442 bài kiểm thử (unit & integration tests) tự động, "
        "tích hợp các mô hình toán học và vật lý vận tải chuyên sâu. Dưới đây là khoảng cách giữa cách thể hiện trên slide và năng lực thật:"
    )

    comp_table = doc.add_table(rows=1, cols=3)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_table.autofit = False

    c_hdr = comp_table.rows[0].cells
    c_hdr_data = [("Hạng mục công nghệ", Inches(1.8)), ("Slide đang viết", Inches(2.2)), ("Codebase thực tế sở hữu", Inches(2.5))]
    for i, (t, w) in enumerate(c_hdr_data):
        c_hdr[i].width = w
        set_cell_background(c_hdr[i], "1E293B")
        set_cell_margins(c_hdr[i], top=90, bottom=90, left=90, right=90)
        p = c_hdr[i].paragraphs[0]
        run = p.add_run(t)
        run.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    tech_diffs = [
        ("Thuật toán tối ưu tuyến (Routing Solver)",
         "Gom cụm địa lý, VRP tự động giải trong 3-5 giây trên bản đồ OSRM.",
         "Eco-ALNS v2: Thuật toán tìm kiếm lân cận thích nghi lớn tích hợp tôi luyện thép (Simulated Annealing). 5 toán tử đặc thù (worst_fuel_removal, ban_window_removal...), cơ chế giới hạn thời gian (time-budget guard) và trọng số thích nghi."),
        
        ("Mô hình tiêu hao & phát thải (Emissions Model)",
         "Tính CO₂ dựa trên km thực tế và tải trọng theo chuẩn GLEC và GHG Protocol.",
         "GLX-HDT-v1: Mô hình vật lý lực cản tức thời (Tier 3 Tractive Physics) tính toán lực cản lăn, cản gió, gia tốc theo khối lượng hàng động trên từng chặng (leg-by-leg dynamic payload) kết hợp suất tiêu hao riêng nhiên liệu (BSFC)."),

        ("Định tuyến đa mục tiêu (Multi-Objective Engine)",
         "Tạo ra một 'tuyến đường tối ưu nhất' chung chung.",
         "EcoPath Pareto Frontier: Triệt tiêu hàm trọng số tuyến tính lỗi thời; cung cấp tập nghiệm Pareto có bảo đảm cam kết thời gian (SLA): Nhanh nhất (Fastest Legal ≤ 0%), Cân bằng (Eco Balanced ≤ 5%), Xanh tối đa (Eco Max ≤ 10%) kèm giải trình toán học (why_facts)."),

        ("Luật cấm tải & Ranh giới TP.HCM",
         "Bộ lọc tránh giờ cấm tải QĐ 23/2018/QĐ-UBND nội đô TP.HCM.",
         "Hệ thống phân tầng hồ sơ xe tải (Truck Profile) với chiều cao, rộng, dài, tải trọng trục; liên kết ranh giới hành chính NSO và cơ chế phản hồi thực địa crowdsourcing từ tài xế được quản trị viên duyệt."),

        ("Hạ tầng kỹ thuật & Chi phí vận hành",
         "Thiết lập server đám mây ban đầu tốn 10.000.000 đ.",
         "Serverless Edge Native (Cloudflare Workers + D1 Database): Phân tán toàn cầu, độ trễ <15ms, chi phí máy chủ nhàn rỗi xấp xỉ 0 đồng, loại bỏ rủi ro sập server hay chi phí hàng chục triệu/tháng của AWS/GCP."),

        ("Chỉ đường cho tài xế",
         "Chỉ đường qua bản đồ OSRM.",
         "Zero-Friction Deep Link: Dẫn đường ô tô Google Maps (travelmode=driving) loại bỏ lỗi tự nhảy sang xe máy tại Việt Nam; giải phóng tài xế khỏi thiết bị chuyên dụng đắt tiền.")
    ]

    for cat, sl_text, code_text in tech_diffs:
        row = comp_table.add_row()
        c = row.cells
        c[0].width = Inches(1.8)
        c[1].width = Inches(2.2)
        c[2].width = Inches(2.5)

        c[0].paragraphs[0].add_run(cat).bold = True
        c[1].paragraphs[0].add_run(sl_text)
        c[2].paragraphs[0].add_run(code_text)

        for cell in c:
            set_cell_margins(cell, top=80, bottom=80, left=90, right=90)
            set_cell_border(cell, bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'})

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ---------------------------------------------------------
    # SECTION 4: MA TRẬN PHÂN TÍCH 5 ĐỐI THỦ THỰC TẾ
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "4. MA TRẬN ĐỐI THỦ CẠNH TRANH TOÀN DIỆN (THAY THẾ SLIDE 8)", level=1)

    p_comp = doc.add_paragraph(
        "Thay vì so sánh với 'Cách làm cũ trên Excel', slide của bạn bắt buộc phải đặt EcoMiles bên cạnh các đối thủ lớn "
        "để chứng minh khoảng trống đổi mới (Innovation Gap) mà EcoMiles độc quyền khai thác:"
    )

    m_table = doc.add_table(rows=1, cols=6)
    m_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    m_table.autofit = False

    m_hdr = m_table.rows[0].cells
    m_cols = [("Tiêu chí", Inches(1.3)), ("EcoMiles", Inches(1.2)), ("Abivin vRoute", Inches(1.0)), ("SmartLog STM", Inches(1.0)), ("AhaMove", Inches(1.0)), ("Google Fleet", Inches(1.0))]
    for i, (t, w) in enumerate(m_cols):
        m_hdr[i].width = w
        set_cell_background(m_hdr[i], "047857" if i == 1 else "0F172A")
        set_cell_margins(m_hdr[i], top=90, bottom=90, left=60, right=60)
        p = m_hdr[i].paragraphs[0]
        run = p.add_run(t)
        run.bold = True
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    matrix_rows = [
        ("Khách hàng mục tiêu", "SME logistics đô thị (10-100 xe tải)", "Tập đoàn FMCG lớn (Unilever, P&G)", "Doanh nghiệp 3PL & Kho vận lớn", "Cá nhân, shop online tức thời", "Doanh nghiệp công nghệ phát triển app"),
        ("Thời gian triển khai", "< 5 phút (File Excel / Web PWA)", "3 - 6 tháng (Tích hợp ERP cồng kềnh)", "1 - 3 tháng (Cấu hình hệ thống)", "Vài phút (Tải app)", "Vài tuần (Phải tự code tích hợp API)"),
        ("Chi phí & Thiết bị", "0 đ phần cứng, SaaS siêu tinh gọn", "10.000 - 50.000 USD+ khởi tạo", "Hàng chục triệu/tháng + máy chủ", "Chiết khấu cao theo đơn (20-25%)", "Giá API đắt đỏ theo lượt gọi (5-10 USD/1k)"),
        ("Độ chuẩn đo phát thải", "Vật lý Tier 3 (Khối lượng động từng chặng)", "Hệ số Tier 1 (Nhân km x hằng số phẳng)", "Nhập thủ công công tơ mét xăng dầu", "Không có đo lường phát thải", "Chỉ ước tính sơ bộ qua Google Carbon API"),
        ("Thuật toán tối ưu", "Eco-ALNS v2 + Pareto Frontier SLA", "Heuristic VRP (20+ ràng buộc DN)", "Xếp chuyến và gán xe cơ bản", "Ghép tài xế gần nhất điểm đón", "Tìm đường điểm-đến-điểm (không giải VRP)"),
        ("Luật cấm tải TP.HCM", "Tích hợp gốc QĐ 23/2018 theo từng xe", "Có tùy biến theo hợp đồng dự án", "Phụ thuộc kinh nghiệm tài xế", "Tập trung xe máy, không có cấm tải", "KHÔNG hỗ trợ cấm tải xe tải tại VN")
    ]

    for row_data in matrix_rows:
        row = m_table.add_row()
        c = row.cells
        for i, val in enumerate(row_data):
            c[i].width = m_cols[i][1]
            p = c[i].paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8)
            if i == 1:
                r.bold = True
                set_cell_background(c[i], "ECFDF5")
            for cell in c:
                set_cell_margins(cell, top=70, bottom=70, left=60, right=60)
                set_cell_border(cell, bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'})

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ---------------------------------------------------------
    # SECTION 5: 5 VŨ KHÍ CẠNH TRANH CÔNG NGHỆ (UNFAIR MOATS)
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "5. NĂM VŨ KHÍ CÔNG NGHỆ ĐỘC TÔN CẦN LÀM NỔI BẬT (UNFAIR MOATS)", level=1)

    moats = [
        ("Vũ khí 1: Mô hình tiêu thụ năng lượng vật lý tức thời (GLX-HDT-v1) thay vì nhân hệ số phẳng",
         "Các phần mềm hiện nay tự nhận 'chuẩn GLEC' chỉ đơn thuần lấy tổng km nhân với một hệ số cố định (ví dụ 0.24 kg CO₂/km). Cách tính này phi khoa học vì xe tải chở 2 tấn hàng lúc xuất phát tiêu thụ dầu gấp đôi so với khi đã giao hết hàng lúc quay về. EcoMiles tính toán chi tiết lực cản lăn, cản gió, quán tính gia tốc trên từng ki-lô-mét dựa theo khối lượng hàng thực tế còn lại trên thùng xe. Đây là nền tảng kiểm kê phát thải Scope 3 chống hiện tượng 'tẩy xanh' (Greenwashing)."),

        ("Vũ khí 2: Thuật toán Eco-ALNS v2 với toán tử triệt tiêu xung đột giờ cấm tải và nhiên liệu",
         "Khác với các thư viện VRP đại trà, thuật toán của EcoMiles sở hữu các toán tử phá hủy chuyên biệt cho đô thị Việt Nam: worst_fuel_removal loại bỏ những điểm dừng phát sinh tiêu hao nhiên liệu biên cao nhất, và ban_window_removal chủ động loại trừ các điểm giao vi phạm khung giờ cấm tải 06:00-09:00 và 16:00-20:00 của TP.HCM."),

        ("Vũ khí 3: Động cơ Pareto đa mục tiêu với giải trình số liệu toán học minh bạch (why_facts)",
         "Trong thực tế, điều phối viên không thể dùng một tuyến đường chỉ biết tiết kiệm CO₂ nếu nó làm trễ hẹn giao hàng cam kết với đối tác. EcoMiles cung cấp 3 gói lựa chọn minh bạch: Nhanh nhất (Fastest Legal), Cân bằng (Eco Balanced ≤ 5% SLA), Xanh tối đa (Eco Max ≤ 10% SLA) kèm văn bản giải trình toán học tự động, giúp chủ doanh nghiệp tự tin ký cam kết dịch vụ."),

        ("Vũ khí 4: Giải phóng phần cứng — 1 Click đồng bộ Google Maps dẫn đường",
         "Doanh nghiệp vừa và nhỏ thất bại khi chuyển đổi số vì không kham nổi chi phí lắp hộp đen định vị (2-4 triệu/xe) hoặc mua điện thoại chuyên dụng. EcoMiles biến bất kỳ chiếc smartphone nào của tài xế thành máy điều hành qua Web PWA; 1 click mở trực tiếp Google Maps ở chế độ ô tô (travelmode=driving) đã được tính toán tuyến an toàn."),

        ("Vũ khí 5: Kiến trúc Serverless Edge — Tiết kiệm 99.9% chi phí hạ tầng máy chủ",
         "Toàn bộ thuật toán và cơ sở dữ liệu phân tán chạy trực tiếp trên mạng lưới Cloudflare Edge (Workers + D1). Độ trễ phản hồi dưới 15 mili-giây, không tốn chi phí duy trì cụm máy chủ đắt tiền khi nhàn rỗi, cho phép định giá gói dịch vụ siêu rẻ chỉ 300.000 - 500.000 đ/xe/tháng mà vẫn đạt biên lợi nhuận ròng vượt trội.")
    ]

    for title, desc in moats:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.space_before = Pt(4)
        p_m.paragraph_format.space_after = Pt(2)
        r_m_title = p_m.add_run(f"• {title}\n")
        r_m_title.bold = True
        r_m_title.font.size = Pt(10.5)
        r_m_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r_m_desc = p_m.add_run(desc)
        r_m_desc.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ---------------------------------------------------------
    # SECTION 6: KHIÊN BẢO VỆ DỮ LIỆU: BẢNG GẮN NHÃN MINH BẠCH SỐ LIỆU
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "6. KHIÊN BẢO VỆ DỮ LIỆU: BẢNG GẮN NHÃN MINH BẠCH (TRÁNH BỊ VẶN HỎI)", level=1)

    p_shield = doc.add_paragraph(
        "Theo hướng dẫn của hội đồng chấm thi VSIC, trung thực về trạng thái dữ liệu là điểm cộng rất lớn. "
        "Tất cả con số trên slide phải được gắn nhãn nguồn gốc chính xác:"
    )

    s_table = doc.add_table(rows=1, cols=4)
    s_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_table.autofit = False

    s_hdr = s_table.rows[0].cells
    s_cols = [("Con số trên slide", Inches(1.5)), ("Cách viết hiện tại (Rủi ro)", Inches(1.8)), ("Cách sửa đổi bắt buộc", Inches(2.2)), ("Nhãn trạng thái", Inches(1.0))]
    for i, (t, w) in enumerate(s_cols):
        s_hdr[i].width = w
        set_cell_background(s_hdr[i], "0F172A")
        set_cell_margins(s_hdr[i], top=90, bottom=90, left=80, right=80)
        p = s_hdr[i].paragraphs[0]
        run = p.add_run(t)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    shield_data = [
        ("-88.31% CO₂ TTW", "Viết như thể kết quả thực tế trên đường", "Giảm 88.3% phát thải so với kịch bản xe chạy giao ngẫu nhiên không gom cụm (zig-zag benchmark)", "[BENCHMARK MÔ PHỎNG]"),
        ("Giảm 20-30% CO₂", "Viết thành khẳng định cam kết đạt được", "Mức kỳ vọng cắt giảm nhiên liệu và phát thải trung bình trong điều kiện giao hàng nội đô thực tế", "[GIẢ ĐỊNH – CẦN PILOT]"),
        ("Triệt tiêu 30% xe rỗng", "Viết như tính năng ghép đơn đang chạy", "Mục tiêu dài hạn khi đạt quy mô kết nối đơn hàng chéo giữa các doanh nghiệp tại Giai đoạn 4", "[LỘ TRÌNH GIAI ĐOẠN 4]"),
        ("Nâng đúng hẹn lên 98.8%", "Viết như số đo thực tế từ tài xế", "Tỷ lệ lịch trình thỏa mãn hoàn toàn khung giờ cam kết (Time-window feasibility) trên tập 80 đơn", "[BENCHMARK THỬ NGHIỆM]"),
        ("Chuẩn hóa ISO 14064", "Viết như EcoMiles đã được cấp chứng nhận", "Thuật toán bám sát phương pháp luận tính toán của GLEC 3.2 và ISO 14083 cho vận tải đường bộ", "[CHUẨN THAM CHIẾU]")
    ]

    for num, cur, fix, tag in shield_data:
        row = s_table.add_row()
        c = row.cells
        for i, val in enumerate([num, cur, fix, tag]):
            c[i].width = s_cols[i][1]
            p = c[i].paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if i == 0:
                r.bold = True
            if i == 3:
                r.bold = True
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                set_cell_background(c[i], "FEF3C7")
                r.font.color.rgb = RGBColor(0x92, 0x40, 0x0E)
        for cell in c:
            set_cell_margins(cell, top=70, bottom=70, left=80, right=80)
            set_cell_border(cell, bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'})

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ---------------------------------------------------------
    # SECTION 7: BÀI TOÁN DẪN ĐƯỜNG TÀI XẾ: GOOGLE MAPS VS. THUẬT TOÁN PROPRIETARY
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "7. BÀI TOÁN DẪN ĐƯỜNG TÀI XẾ: GOOGLE MAPS VS. THUẬT TOÁN PROPRIETARY", level=1)

    p_nav_intro = doc.add_paragraph(
        "Đây là câu hỏi cốt tử về mặt kiến trúc công nghệ và trải nghiệm thực địa mà Ban Giám Khảo hoặc nhà đầu tư "
        "chắc chắn sẽ chất vấn: 'Nếu bấm Dẫn đường mà nhảy sang Google Maps, thì Google Maps sẽ tự tính lại đường đi chặng đó. "
        "Lỡ Google dẫn xe tải vào đường cấm thì thuật toán tối ưu của các bạn còn tác dụng gì? Làm sao để dẫn đường dùng chính thuật toán của EcoMiles?'"
    )

    style_heading(doc.add_paragraph(), "7.1. Phân định vai trò: Tối ưu vĩ mô (Macro) vs. Lái xe vi mô (Micro)", level=2)
    add_callout(doc, [
        ("KHẲNG ĐỊNH: LỘ TRÌNH TÀI XẾ NHẬN ĐÃ CÓ 100% THUẬT TOÁN ECOMILES\n", True, RGBColor(0x05, 0x96, 0x69), 10.5),
        ("• Thuật toán Eco-ALNS v2 đã giải toàn bộ bài toán gom đơn, xếp xe và định đoạt trình tự ghé thăm tối ưu: Kho -> Điểm 1 -> Điểm 2 -> ... -> Điểm N.\n"
         "• Trình tự này bảo đảm 3 điều kiện: (1) Tiết kiệm dầu nhất theo tải trọng động; (2) Tránh hoàn toàn khung giờ cấm tải QĐ 23/2018 (06h-09h & 16h-20h); (3) Thỏa mãn khung giờ nhận hàng của khách.\n"
         "• Nếu không có EcoMiles, tài xế mở Google Maps lên sẽ hoàn toàn bất lực vì Google Maps KHÔNG THỂ phân bổ 80 đơn cho 10 xe và không biết sắp thứ tự giao.", False, None, 9.5)
    ], bg_hex="F8FAFC", border_color="0284C7")

    style_heading(doc.add_paragraph(), "7.2. Ba giải pháp công nghệ để dẫn đường thực sự tuân thủ thuật toán EcoMiles", level=2)

    nav_solutions = [
        ("Giải pháp 1: Ghim điểm nút hành lang an toàn (Waypoint Corridor Pinning) — Cầu nối tức thì (0 đ chi phí)",
         "Google Maps không cho truyền file hình học (polyline), nhưng CHO PHÉP truyền các điểm trung gian (waypoints) qua URL. Thay vì chỉ truyền điểm đến, hệ thống EcoMiles tự động trích xuất 2-3 tọa độ nút giao an toàn trên trục đường vành đai đã duyệt (ví dụ: Võ Văn Kiệt, Mai Chí Thọ, QL1A) và chèn vào link: google.com/maps/dir/?api=1&destination=...&waypoints=lat1,lng1|lat2,lng2. Kết quả: Google Maps bị ép buộc phải vẽ đường qua các đại lộ cho phép xe tải, không thể tự tiện rẽ tắt vào các ngõ hẻm cấm xe tải."),

        ("Giải pháp 2: Điều hướng nhúng độc quyền trong ứng dụng (Embedded In-App Navigation) — Giải pháp chuẩn Enterprise",
         "Đây là cách các kỳ lân logistics thế giới (Grab, UPS ORION, Abivin) xử lý triệt để: KHÔNG DÙNG GOOGLE MAPS để dẫn đường bên ngoài. Thay vào đó, tích hợp bản đồ MapLibre / OpenStreetMap trực tiếp vào App tài xế (PWA/Flutter). Hệ thống Valhalla của EcoMiles bắn tọa độ polyline và danh sách khẩu lệnh rẽ (Maneuvers: 'Rẽ phải vào Lý Thường Kiệt sau 100m') kèm giọng nói tiếng Việt. Xe chạy theo đúng 100% từng mét đường đã duyệt. Không lo Google tính lại, không tốn 1 xu tiền bản quyền."),

        ("Giải pháp 3: Mô hình vận hành kép thực tế (Dual-Mode) cho giai đoạn MVP",
         "Giai đoạn hiện tại áp dụng mô hình kép: Lịch trình hiển thị rõ hành lang hành chính (Tân Bình -> Phú Nhuận -> Q10 -> Q1) và huy hiệu cảnh báo giờ cấm tải QĐ 23. Nút Google Maps chỉ đóng vai trò trợ lái vi mô trong 500m cuối để tài xế tìm số nhà cụ thể trong ngõ hẻm.")
    ]

    for s_title, s_desc in nav_solutions:
        p_s = doc.add_paragraph()
        p_s.paragraph_format.space_before = Pt(4)
        p_s.paragraph_format.space_after = Pt(2)
        r_st = p_s.add_run(f"• {s_title}\n")
        r_st.bold = True
        r_st.font.size = Pt(10)
        r_st.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r_sd = p_s.add_run(s_desc)
        r_sd.font.size = Pt(9.5)

    style_heading(doc.add_paragraph(), "7.3. Kịch bản đối đáp sắc bén khi pitching trước Ban Giám Khảo (Winning Q&A)", level=2)
    add_callout(doc, [
        ("CÂU HỎI CỦA GIÁM KHẢO: ", True, RGBColor(0xDC, 0x26, 0x26), 10.5),
        ("“Nếu tài xế bấm nút dẫn đường mà nhảy sang Google Maps, thì Google sẽ tự tính lại đường đi. Lỡ Google chỉ vào đường cấm thì thuật toán của các bạn còn ý nghĩa gì?”\n\n", False, RGBColor(0xDC, 0x26, 0x26), 10),
        ("CÂU TRẢ LỜI MẪU CHIẾN THẮNG:\n", True, RGBColor(0x05, 0x96, 0x69), 10.5),
        ("“Dạ thưa Ban Giám Khảo, đây chính là sự khác biệt giữa Tối ưu hóa điều phối vĩ mô (Macro-VRP) và Dẫn đường vi mô (Micro-Steering):\n"
         "1. Thuật toán Eco-ALNS v2 của chúng em giải quyết bài toán lớn nhất mà Google Maps bất lực: phân bổ 80 đơn cho 10 xe và sắp xếp trình tự dừng đỗ tránh khung giờ cấm tải 06h-09h và 16h-20h của TP.HCM.\n"
         "2. Ở giai đoạn MVP (Phase 1), để doanh nghiệp SME không phải tốn hàng trăm triệu mua thiết bị định vị GPS chuyên dụng, chúng em dùng cơ chế Ghim điểm nút hành lang (Waypoint Pinning) ép Google Maps phải đi qua trục đường lớn và hiển thị cảnh báo cấm tải trực quan.\n"
         "3. Trong lộ trình Phase 2, EcoMiles sẽ tích hợp động cơ dẫn đường nhúng MapLibre/Valhalla chạy độc lập ngay trong ứng dụng, triệt tiêu hoàn toàn sự phụ thuộc vào Google Maps và bảo đảm xe tuân thủ 100% cung đường đã duyệt từ kho đến điểm giao.”", False, RGBColor(0x0F, 0x17, 0x2A), 9.5)
    ], bg_hex="ECFDF5", border_color="059669")

    # ---------------------------------------------------------
    # SECTION 8: KỊCH BẢN THAY THẾ TỪNG CHỮ CHO SLIDE 6 & 8
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "8. KỊCH BẢN THAY THẾ NỘI DUNG COPY-PASTE CHO SLIDE 6 VÀ SLIDE 8", level=1)

    style_heading(doc.add_paragraph(), "Kịch bản Slide 6: Giải Pháp Đột Phá — Nền Tảng Điều Hành & Tối Ưu Phát Thải", level=2)
    add_callout(doc, [
        ("TIÊU ĐỀ SLIDE: ", True, RGBColor(0x0F, 0x17, 0x2A), 10.5),
        ("GIẢI PHÁP ĐỘT PHÁ: NỀN TẢNG CARGOX ENGINE\n", True, RGBColor(0x05, 0x96, 0x69), 11),
        ("TIÊU ĐỀ PHỤ: ", True, RGBColor(0x0F, 0x17, 0x2A), 10),
        ("4 TRỤ CỘT CÔNG NGHỆ LÕI KHÁC BIỆT CỦA ECOMILES\n\n", False, None, 10),
        ("Khối 01: THUẬT TOÁN ĐIỀU PHỐI THÍCH NGHI ECO-ALNS v2\n", True, RGBColor(0x03, 0x69, 0xA1), 10),
        ("• Tự động phá vỡ và tái cấu trúc tuyến đường dựa trên mức độ ngốn nhiên liệu cận biên (worst_fuel_removal) và tránh điểm xung đột cấm tải (ban_window_removal).\n"
         "• Thuật toán tôi luyện thép (Simulated Annealing) giải tối ưu 80 đơn hàng / 10 xe trong < 5 giây với bảo chứng an toàn thời gian chạy.\n\n", False, None, 9.5),
        ("Khối 02: MÔ HÌNH NĂNG LƯỢNG VẬT LÝ TẢI TRỌNG ĐỘNG GLX-HDT-v1\n", True, RGBColor(0x03, 0x69, 0xA1), 10),
        ("• Tính toán lực kéo cơ học và tiêu thụ dầu diesel tức thời theo khối lượng hàng thực tế thay đổi qua từng điểm dừng (Dynamic Gross Mass).\n"
         "• Thay thế triệt để các hệ số phát thải phẳng lỗi thời, phục vụ báo cáo kiểm kê khí nhà kính Scope 3 chuẩn xác cho Nghị định 06.\n\n", False, None, 9.5),
        ("Khối 03: ĐỘNG CƠ RA QUYẾT ĐỊNH ĐA MỤC TIÊU PARETO (ECOPATH)\n", True, RGBColor(0x03, 0x69, 0xA1), 10),
        ("• Xóa bỏ hàm trọng số gộp km và CO₂ thiếu thực tế; cung cấp 3 phương án bảo đảm cam kết giao hàng: Fastest Legal (Nhanh nhất), Eco Balanced (Cân bằng ≤ 5% SLA), Eco Max (Xanh tối đa ≤ 10% SLA).\n"
         "• Xuất tài liệu giải trình toán học minh bạch (why_facts) cho từng chuyến xe.\n\n", False, None, 9.5),
        ("Khối 04: LUẬT CẤM TẢI GỐC ĐÔ THỊ & ĐIỀU HÀNH THỜI GIAN THỰC\n", True, RGBColor(0x03, 0x69, 0xA1), 10),
        ("• Tích hợp trực tiếp Quyết định 23/2018/QĐ-UBND theo chiều cao, tải trọng và trục xe; dẫn đường ô tô Google Maps 1 click không bị lỗi xe máy.\n"
         "• Vòng lặp crowdsourcing tài xế báo cáo cấm đường thực địa về trung tâm điều phối kiểm duyệt.", False, None, 9.5)
    ], bg_hex="F8FAFC", border_color="0369A1")

    style_heading(doc.add_paragraph(), "Kịch bản Slide 8: Lợi Thế Cạnh Tranh & Ma Trận Khác Biệt", level=2)
    add_callout(doc, [
        ("NỘI DUNG SLIDE 8: ", True, RGBColor(0x0F, 0x17, 0x2A), 10.5),
        ("ĐƯA BẢNG MA TRẬN 5 BÊN (MỤC 4 CỦA BÁO CÁO NÀY) LÊN SLIDE\n\n", True, RGBColor(0x05, 0x96, 0x69), 11),
        ("CÂU CHỐT HẠ GHI ĐIỂM DƯỚI BẢNG (BOTTOM PUNCHLINE):\n", True, RGBColor(0x0F, 0x17, 0x2A), 10),
        ("“Trong khi các phần mềm trên thị trường hoặc quá cồng kềnh, đắt đỏ cho tập đoàn lớn (Abivin, SmartLog - hàng trăm triệu đồng, mất hàng tháng tích hợp), hoặc chỉ tập trung vào đội xe máy công nghệ giao tức thời (AhaMove), EcoMiles là nền tảng SaaS duy nhất tại Việt Nam dân chủ hóa thuật toán tối ưu đa mục tiêu chuẩn vật lý Tier 3 và kiểm soát luật cấm tải TP.HCM cho 34.000+ doanh nghiệp vận tải vừa và nhỏ với chi phí tiếp cận gần như bằng 0.”", False, RGBColor(0x0F, 0x17, 0x2A), 10)
    ], bg_hex="ECFDF5", border_color="059669")

    # Save to both paths
    doc.save(str(out_docx_audit))
    doc.save(str(out_docx_root))
    print(f"Successfully generated DOCX files:")
    print(f"  1. {out_docx_audit}")
    print(f"  2. {out_docx_root}")

if __name__ == "__main__":
    main()
