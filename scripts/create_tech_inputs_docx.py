import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_tech_inputs_docx():
    doc = Document()

    # Page Margins (1 inch everywhere)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    normal_style.paragraph_format.line_spacing = 1.25
    normal_style.paragraph_format.space_after = Pt(6)

    # Helper function for setting background color on table cells
    def set_cell_background(cell, fill_hex):
        shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading_elm)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Header / Title Box
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_sub = title_p.add_run("TÀI LIỆU NỘI BỘ — DÀNH CHO THÀNH VIÊN LÀM PLAN & SLIDE (VSIC 2026)\n")
    run_sub.font.size = Pt(10)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Emerald Green

    run_title = title_p.add_run("GỢI Ý GÓC NHÌN KỸ THUẬT (TECH INPUTS)\nTRẢ LỜI 6 GÓP Ý CỦA BAN GIÁM KHẢO")
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Dark Navy

    # Metadata callout box
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.cell(0, 0)
    meta_cell.width = Inches(6.5)
    set_cell_background(meta_cell, "F1F5F9")
    set_cell_margins(meta_cell, top=140, bottom=140, left=200, right=200)
    
    meta_p = meta_cell.paragraphs[0]
    meta_p.paragraph_format.space_after = Pt(0)
    meta_run = meta_p.add_run(
        "• Người gửi: Bộ phận Kỹ thuật / Tech Team (EcoMiles)\n"
        "• Mục đích: Liệt kê ý tưởng thuần túy từ góc nhìn phần mềm và công nghệ để bạn làm Plan dễ dàng đưa vào đề án và slide. "
        "Không phức tạp hóa, không nhồi nhét số liệu rối rắm, tập trung vào bản chất logic và sự trung thực của dự án."
    )
    meta_run.font.size = Pt(10)
    meta_run.font.italic = True
    meta_run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_paragraph() # Spacer

    # -------------------------------------------------------------
    # MỤC 1
    # -------------------------------------------------------------
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    r1 = h1.add_run("1. VẤN ĐỀ & TẠI SAO NÓ VẪN TỒN TẠI (5 WHYS & CHÂN DUNG NGƯỜI TRONG CUỘC)")
    r1.font.size = Pt(13)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "BGK nhận xét: Đề án cũ mới có số liệu vĩ mô (17% GDP, 80% khí thải đường bộ...), thiếu lý do tại sao vấn đề vẫn tồn tại (Why it persists) và thiếu yếu tố con người (định tính, persona). Dưới góc độ kỹ thuật, bạn làm Plan có thể dùng các ý sau:"
    )

    # 5 Whys
    p_why = doc.add_paragraph()
    r_why_title = p_why.add_run("A. Chuỗi 5 câu hỏi 'Tại sao' (5 Whys Root Cause Analysis):\n")
    r_why_title.font.bold = True
    p_why.add_run(
        "1. Tại sao xe tải chạy lòng vòng, tốn xăng và xả nhiều khói? → Vì các chuyến xe được sắp xếp chắp vá, xe chạy chồng chéo và lúc về thường thùng rỗng.\n"
        "2. Tại sao người quản lý không sắp xếp lộ trình gọn hơn và tìm hàng chiều về? → Vì điều phối viên phải chia hàng trăm đơn bằng tay, dựa vào trí nhớ và bảng tính Excel thủ công.\n"
        "3. Tại sao họ không mua phần mềm quản lý vận tải (TMS) chuyên nghiệp? → Vì các hệ thống lớn (như SAP, Oracle, Route4Me) chi phí quá đắt (vài chục đến cả trăm triệu), giao diện phức tạp, doanh nghiệp vừa và nhỏ (SME 5–20 xe) không thể với tới.\n"
        "4. Tại sao họ không dùng app gọi xe công nghệ (Lalamove, Ahamove)? → Doanh nghiệp đã đầu tư sẵn xe tải và tài xế riêng của mình. App gọi xe bên ngoài cắt phế hoa hồng rất cao (18–25%) và không giúp doanh nghiệp quản trị đội xe nội bộ.\n"
        "5. Tại sao không ai đo lường phát thải CO2? → Vì không có công cụ tính tự động, không ai rảnh rỗi ngồi nhân chia công thức môi trường phức tạp.\n"
        "👉 KẾT LUẬN CHO PLAN (Root Cause): Nguyên nhân gốc rễ là thị trường thiếu một công cụ tinh gọn, giá rẻ, mở web lên là chia được tuyến ngay, vừa né được giờ cấm tải TP.HCM, vừa tự tính luôn lượng CO2 giảm được mà không cần mua thiết bị đắt tiền."
    )

    # Persona
    p_per = doc.add_paragraph()
    r_per_title = p_per.add_run("B. Hai chân dung người dùng thực tế (Personas định tính):\n")
    r_per_title.font.bold = True
    p_per.add_run(
        "• Nhân vật 1: Anh Tuấn (42 tuổi) — Điều phối viên kho hàng (Người dùng Web Console)\n"
        "  - Công việc: Mỗi sáng sớm nhận danh sách 80 đơn hàng, mắt nhìn bản đồ, tay gõ biển số xe vào Excel, liên tục gọi điện thoại giục tài xế qua Zalo.\n"
        "  - Nỗi sợ: Sợ nhất là chia nhầm xe đi vào đường cấm tải giờ cao điểm TP.HCM (bị công an phạt hoặc giam xe); sợ khách giục giao gấp mà không biết tài xế đang kẹt ở đâu.\n"
        "  - Mong muốn: Chỉ cần bấm 1 nút là máy tính tự gom đơn thành các tuyến xe hợp lý, cảnh báo ngay đơn nào bị trùng giờ cấm tải.\n\n"
        "• Nhân vật 2: Chú Hùng (48 tuổi) — Tài xế xe tải 1.5 tấn (Người dùng App điện thoại PWA)\n"
        "  - Công việc: Cầm điện thoại nhận địa chỉ đi giao quanh các quận nội thành TP.HCM.\n"
        "  - Nỗi sợ: Sợ đường kẹt xe giờ cao điểm; sợ bị phạt vì vào đường cấm; và ngán ngẩm nhất là khi giao xong đơn cuối ở Quận 7 thì phải chạy xe không quay về kho Tân Bình (vừa mệt người vừa tốn tiền dầu vô ích).\n"
        "  - Mong muốn: Có một màn hình điện thoại đơn giản chỉ rõ thứ tự điểm 1, điểm 2, điểm 3 cần giao; bấm một nút 'Đã giao' là xong, không phải gọi điện báo cáo thủ công."
    )

    # -------------------------------------------------------------
    # MỤC 2
    # -------------------------------------------------------------
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    r2 = h2.add_run("2. PHẦN ĐỐI THỦ: GIẢI PHÁP THAY THẾ & KHOẢNG TRỐNG ĐỔI MỚI (INNOVATION GAP)")
    r2.font.size = Pt(13)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "BGK nhận xét: Bắt buộc phải có phần so sánh các giải pháp đang tồn tại và chỉ ra Innovation Gap. Ý tưởng cho bạn làm Plan như sau:"
    )

    # Competitor Table
    table2 = doc.add_table(rows=5, cols=3)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers2 = ["Nhóm giải pháp hiện có", "Điểm yếu thực tế", "EcoMiles giải quyết thế nào?"]
    for i, h in enumerate(headers2):
        cell = table2.cell(0, i)
        cell.paragraphs[0].add_run(h).font.bold = True
        set_cell_background(cell, "E2E8F0")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    comp_data = [
        ("1. Excel + Zalo + Google Maps", 
         "Miễn phí nhưng làm thủ công, tuyến đi zig-zag tốn xăng, dễ nhầm lẫn, không có số liệu xanh.",
         "Tự động gom cụm và sắp xếp thứ tự giao hàng bằng thuật toán trong 1 click."),
        ("2. Phần mềm lớn (SAP, Bravo, Fast)",
         "Quá đắt, cài đặt mất vài tháng, chủ yếu quản lý kế toán kho, không chuyên sâu tối ưu lộ trình nội đô.",
         "Tinh gọn cho SME, mở trình duyệt là chạy ngay, chi phí thuê bao tháng cực kỳ bình dân."),
        ("3. App giao hàng (Lalamove, Ahamove)",
         "Chỉ dành cho đơn vãng lai lẻ tẻ, cắt phế hoa hồng cao, không quản lý được đội xe có sẵn của công ty.",
         "Cung cấp công cụ quản trị nội bộ cho chính đội xe và tài xế riêng của doanh nghiệp."),
        ("4. Phần mềm ngoại (Route4Me, LogiNext)",
         "Giá tính bằng USD rất đắt, giao diện tiếng Anh khó dùng cho tài xế, không hiểu quy định cấm tải TP.HCM.",
         "Giao diện thuần Việt, tích hợp sẵn cảnh báo giờ cấm tải TP.HCM (QĐ 23/2018) và chuẩn đo CO2.")
    ]

    for row_idx, data in enumerate(comp_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table2.cell(row_idx, col_idx)
            cell.paragraphs[0].add_run(text).font.size = Pt(9.5)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

    p_gap = doc.add_paragraph()
    p_gap.paragraph_format.space_before = Pt(8)
    r_gap_title = p_gap.add_run("👉 Hai khoảng trống đổi mới (Innovation Gap) để nhấn mạnh trên Slide:\n")
    r_gap_title.font.bold = True
    p_gap.add_run(
        "1. Tích hợp kép (Vận hành + Phát thải): Phần mềm duy nhất tại Việt Nam vừa giúp doanh nghiệp giảm chi phí nhiên liệu, vừa tự động xuất báo cáo kiểm kê CO2 chuẩn quốc tế (GLEC / GHG Protocol) phục vụ báo cáo ESG.\n"
        "2. Không tốn chi phí thiết bị: Hoạt động hoàn toàn qua nền tảng Web & Web App di động (PWA), tài xế không cần cài ứng dụng nặng từ App Store, doanh nghiệp không phải mua thêm hộp đen hay phần cứng đắt tiền."
    )

    # -------------------------------------------------------------
    # MỤC 3
    # -------------------------------------------------------------
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    r3 = h3.add_run("3. TÁCH RÕ ĐỐI TƯỢNG: CUSTOMERS — USERS — BENEFICIARIES & % TRÙNG LẶP")
    r3.font.size = Pt(13)
    r3.font.bold = True
    r3.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "BGK nhận xét: Không được gộp chung 'khách hàng mục tiêu'. Phải tách rõ ai trả tiền, ai dùng, ai hưởng lợi và tỷ lệ trùng lặp. Góc nhìn Tech rất rõ ràng như sau:"
    )

    p_cub = doc.add_paragraph()
    p_cub.add_run(
        "• 1. Customers (Người mua / Người trả tiền): Chủ doanh nghiệp vận tải nhỏ, Giám đốc chuỗi cung ứng/bán lẻ. "
        "Họ trả tiền vì phần mềm giúp họ tiết kiệm chi phí xăng dầu hàng tháng và có hồ sơ xanh để làm việc với đối tác lớn.\n"
        "• 2. Users (Người trực tiếp thao tác phần mềm):\n"
        "   - Điều phối viên (Dispatcher): Dùng màn hình Bàn điều hành trên máy tính để nạp đơn, bấm tối ưu và xuất báo cáo.\n"
        "   - Tài xế (Driver): Cầm điện thoại xem danh sách điểm giao, bấm 'Đến nơi', 'Đã giao' để hệ thống ghi nhận.\n"
        "• 3. Beneficiaries (Người thụ hưởng tác động xã hội & môi trường):\n"
        "   - Cộng đồng đô thị: Xe tải không chạy lòng vòng giúp đường phố bớt kẹt xe giờ tan tầm, không khí đô thị bớt khói bụi độc hại.\n"
        "   - Tài xế: Được chia lộ trình hợp lý, không phải chạy vòng vèo mệt mỏi, công việc nhẹ nhàng và an toàn hơn.\n"
        "   - Người nhận hàng: Được giao hàng đúng khung giờ đã hẹn.\n\n"
        "👉 Ước tính tỷ lệ trùng lặp (% Overlap Rate) cho Plan:\n"
        "- Ở hộ kinh doanh cá thể hoặc đội xe siêu nhỏ (1–2 xe): Chủ xe vừa điều phối vừa trực tiếp lái xe → Tỷ lệ trùng lặp giữa Người mua (Customer) và Người dùng (User) khoảng 30% – 40%.\n"
        "- Ở doanh nghiệp vận tải có từ 5 xe trở lên (Khách hàng mục tiêu chính): Chủ xe/kế toán ở văn phòng, tài xế lái xe ngoài đường → Tỷ lệ trùng lặp là 0% (tách biệt hoàn toàn)."
    )

    # -------------------------------------------------------------
    # MỤC 4
    # -------------------------------------------------------------
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)
    r4 = h4.add_run("4. NGUỒN THU: IMPACT-DRIVEN BUSINESS MODEL (NỐI DÒNG TIỀN VÀ DÒNG TÁC ĐỘNG)")
    r4.font.size = Pt(13)
    r4.font.bold = True
    r4.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "BGK nhận xét: Nguồn thu không được chỉ liệt kê rời rạc. Phải chứng minh được dòng tiền và dòng tác động nối vào nhau thế nào (Mô hình kinh doanh tạo tác động). Ý tưởng giải thích như sau:"
    )

    p_flow = doc.add_paragraph()
    p_flow.add_run(
        "Thay vì nói 'phần mềm thu phí 300k/tháng', hãy trình bày theo Vòng lặp nhân quả (Cause-and-Effect Loop):\n\n"
        "1. Hành động công nghệ: Phần mềm tự động gom cụm đơn hàng, xếp đường đi ngắn nhất và tìm hàng chở chiều về.\n"
        "   ↓\n"
        "2. Dòng tác động (Impact Flow): Cắt giảm quãng đường thừa → Giảm tiêu hao lít dầu diesel → Giảm trực tiếp lượng khí thải CO2 xả ra môi trường (đo chuẩn quốc tế GLEC).\n"
        "   ↓\n"
        "3. Giá trị kinh tế cho khách hàng: Mỗi xe tải tiết kiệm được một khoản tiền dầu thực tế đáng kể mỗi tháng (vài triệu đồng/xe).\n"
        "   ↓\n"
        "4. Dòng tiền cho dự án (Financial Flow): Doanh nghiệp sẵn sàng trích ra một phần rất nhỏ từ chính số tiền dầu tiết kiệm được (khoảng 10%) để trả phí thuê bao phần mềm hàng tháng cho EcoMiles (mô hình Win-Win, khách hàng có lãi ngay từ tháng đầu sử dụng).\n"
        "   ↓\n"
        "5. Nguồn thu bổ sung: Dịch vụ cấp báo cáo kiểm kê phát thải CO2 đạt chuẩn để doanh nghiệp nộp hồ sơ đấu thầu xanh hoặc báo cáo đối tác quốc tế."
    )

    # -------------------------------------------------------------
    # MỤC 5
    # -------------------------------------------------------------
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(4)
    r5 = h5.add_run("5. ĐỊNH VỊ: BẢN ĐỒ NHẬN THỨC (PERCEPTUAL MAP) & POSITIONING STATEMENT")
    r5.font.size = Pt(13)
    r5.font.bold = True
    r5.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "BGK nhận xét: Bắt buộc có Perceptual Map và câu định vị chuẩn format VSIC. Gợi ý cấu trúc cho slide:"
    )

    p_map = doc.add_paragraph()
    p_map.add_run(
        "A. Bản đồ nhận thức 2 trục (Perceptual Map):\n"
        "• Trục dọc (Y): Mức độ đo lường phát thải CO2 (Dưới là Không đo lường ──> Trên là Tự động đo chuẩn quốc tế GLEC).\n"
        "• Trục ngang (X): Chi phí & Tính dễ dùng (Trái là Đắt đỏ / Cồng kềnh ──> Phải là Tinh gọn / Giá rẻ cho SME).\n"
        "• Vị trí các bên:\n"
        "  - Excel/Zalo: Nằm ở góc dưới bên phải (Rẻ nhưng không tối ưu, 0% đo lường CO2).\n"
        "  - SAP / TMS lớn: Nằm ở góc dưới bên trái (Rất đắt tiền, cồng kềnh, không tập trung đo xanh).\n"
        "  - Route4Me: Nằm ở góc trên bên trái (Tối ưu tốt nhưng giá USD quá đắt, không hợp SME Việt Nam).\n"
        "  - ECOMILES: NẰM Ở GÓC TRÊN BÊN PHẢI (Vị thế độc tôn: Vừa đo phát thải xanh chuẩn quốc tế, vừa tinh gọn, giá bình dân cho doanh nghiệp Việt Nam).\n\n"
        "B. Câu phát biểu định vị (Positioning Statement chuẩn format VSIC):\n"
        "\"Dành cho các doanh nghiệp vận tải đô thị vừa và nhỏ (SME) tại Việt Nam đang muốn giảm chi phí dầu và đáp ứng tiêu chuẩn xanh, "
        "EcoMiles là nền tảng điều phối tuyến thông minh và kiểm kê phát thải CO2 tự động, "
        "giúp cắt giảm quãng đường lãng phí và tự động cấp báo cáo phát thải đạt chuẩn quốc tế, "
        "khác với cách làm thủ công bằng Excel hay các phần mềm nước ngoài đắt đỏ, "
        "giải pháp của chúng tôi cực kỳ tinh gọn, hiểu luật cấm tải đô thị Việt Nam và vận hành ngay trên điện thoại với chi phí tiết kiệm.\""
    )

    # -------------------------------------------------------------
    # MỤC 6
    # -------------------------------------------------------------
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(4)
    r6 = h6.add_run("6. PHÂN LOẠI SỐ LIỆU MINH BẠCH: ĐÃ KIỂM CHỨNG / BENCHMARK / GIẢ ĐỊNH")
    r6.font.size = Pt(13)
    r6.font.bold = True
    r6.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "[LƯU Ý QUAN TRỌNG NHẤT] Các con số như 'giảm 20–30% quãng đường' hay 'giảm xe chạy rỗng xuống 5–10%' không được viết như thể đã đạt được ngoài đời thực. "
        "BGK sẽ hỏi ngay 'Số này ở đâu ra?'. Tech team phân loại sẵn 3 nhóm số liệu để bạn làm Plan tự tin gắn nhãn trên Slide:"
    )

    table6 = doc.add_table(rows=4, cols=2)
    table6.alignment = WD_TABLE_ALIGNMENT.CENTER
    table6.cell(0, 0).paragraphs[0].add_run("Nhóm nhãn số liệu").font.bold = True
    table6.cell(0, 1).paragraphs[0].add_run("Ý nghĩa & Dữ liệu thực tế cho Plan").font.bold = True
    set_cell_background(table6.cell(0, 0), "E2E8F0")
    set_cell_background(table6.cell(0, 1), "E2E8F0")

    labels_data = [
        ("[ĐÃ KIỂM CHỨNG]\n(Tech đã chạy thật trên phần mềm)",
         "• Thuật toán đã chạy thành công trên kịch bản 80 đơn hàng mẫu phân bổ ở TP.HCM với 10 xe tải.\n"
         "• Thời gian tính toán lộ trình cực nhanh: dưới 1 giây.\n"
         "• Tự động phát hiện và cảnh báo các đơn hàng rơi vào khung giờ cấm tải TP.HCM (Quyết định 23/2018).\n"
         "• Tài xế bấm cập nhật trên điện thoại thì máy tính văn phòng đồng bộ tức thời qua API.\n"
         "• Hệ thống chạy mượt mà cả trên mạng đám mây lẫn chạy nội bộ không cần Internet."),
        ("[BENCHMARK NGÀNH]\n(Trích từ báo cáo chính thống)",
         "• Chi phí logistics Việt Nam chiếm khoảng 16.8% – 17% GDP (Báo cáo Logistics Bộ Công Thương).\n"
         "• Vận tải đường bộ chiếm 80% phát thải CO2 toàn ngành giao thông (Bộ Giao thông Vận tải).\n"
         "• Tỷ lệ xe tải chạy rỗng tại Việt Nam trung bình từ 30% đến 35% (World Bank & Hiệp hội VLA).\n"
         "• 1 lít dầu diesel đốt ra khoảng 2.68 kg CO2 (chuẩn quốc tế IPCC / GLEC Framework)."),
        ("[GIẢ ĐỊNH – CẦN PILOT]\n(Kỳ vọng khi đưa ra đời thực)",
         "• Kỳ vọng cắt giảm được 15% – 25% quãng đường di chuyển thực tế khi xe chạy ngoài đường phố kẹt xe TP.HCM.\n"
         "• Kỳ vọng giảm tỷ lệ xe chạy rỗng chiều về từ 30–35% xuống khoảng 15–20% khi có mạng lưới ghép đơn.\n"
         "• Dự kiến thời gian hoàn vốn đầu tư dự án khoảng 1.5 – 2 năm.\n"
         "👉 Lời khuyên khi pitch: Hãy thẳng thắn nói với BGK đây là mục tiêu nhóm đặt ra cho giai đoạn chạy thử nghiệm thực tế (Pilot) sắp tới. Sự trung thực này là điểm cộng rất lớn trong mắt giám khảo VSIC!")
    ]

    for row_idx, (col1, col2) in enumerate(labels_data, start=1):
        c1 = table6.cell(row_idx, 0)
        c2 = table6.cell(row_idx, 1)
        c1.paragraphs[0].add_run(col1).font.size = Pt(9.5)
        c2.paragraphs[0].add_run(col2).font.size = Pt(9.5)
        set_cell_margins(c1, top=80, bottom=80, left=100, right=100)
        set_cell_margins(c2, top=80, bottom=80, left=100, right=100)

    # Save to file
    out_dir = "docs/contests/SO_2026"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "GOI_Y_TECH_CHO_PLAN_VSIC.docx")
    doc.save(out_path)
    print(f"Successfully saved docx to {out_path}")

if __name__ == "__main__":
    create_tech_inputs_docx()
