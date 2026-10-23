import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_tech_inputs_panasonic_docx():
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
    run_sub = title_p.add_run("TÀI LIỆU NỘI BỘ — DÀNH CHO THÀNH VIÊN LÀM PLAN & SLIDE (PANASONIC GREEN IMPACT 2026)\n")
    run_sub.font.size = Pt(10)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Emerald Green

    run_title = title_p.add_run("GỢI Ý GÓC NHÌN KỸ THUẬT (TECH INPUTS)\nTRẢ LỜI 6 TRỌNG TÂM CHIẾN LƯỢC CỦA BAN GIÁM KHẢO")
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
        "• Dự án: EcoMiles — Nền tảng điều phối tuyến vận tải thông minh & kiểm kê CO₂ tự động\n"
        "• Người gửi: Bộ phận Kỹ thuật / Tech Team (EcoMiles)\n"
        "• Mục đích: Cung cấp toàn bộ luận cứ công nghệ và logic giải pháp bám sát mục tiêu Net Zero & cam kết Panasonic GREEN IMPACT. "
        "Tập trung vào bản chất logic, tính khả thi của MVP và sự trung thực minh bạch của dữ liệu."
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
    r1 = h1.add_run("1. VẤN ĐỀ & NGUYÊN NHÂN GỐC RỄ (5 WHYS & CHÂN DUNG NGƯỜI TRONG CUỘC)")
    r1.font.size = Pt(13)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph(
        "Định hướng Panasonic: Chương trình Panasonic GREEN IMPACT đòi hỏi các giải pháp không dừng lại ở số liệu vĩ mô chung chung (17% GDP chi phí logistics, 80% phát thải đường bộ...), mà phải đi sâu vào bản chất tại sao nghịch lý này vẫn tồn tại (Why it persists) và giải quyết câu chuyện thực tế của con người trong chuỗi cung ứng. Dưới góc độ kỹ thuật, bạn làm Plan có thể dùng các ý sau:"
    )

    # 5 Whys
    p_why = doc.add_paragraph()
    r_why_title = p_why.add_run("A. Chuỗi 5 câu hỏi 'Tại sao' (5 Whys Root Cause Analysis):\n")
    r_why_title.font.bold = True
    p_why.add_run(
        "1. Tại sao xe tải chạy lòng vòng, tốn xăng và xả nhiều khói CO₂? → Vì các chuyến xe được sắp xếp chắp vá, xe chạy chồng chéo và lúc về thường thùng rỗng.\n"
        "2. Tại sao người quản lý không sắp xếp lộ trình gọn hơn và tìm hàng chiều về? → Vì điều phối viên phải chia hàng trăm đơn bằng tay, dựa vào trí nhớ và bảng tính Excel thủ công.\n"
        "3. Tại sao họ không mua phần mềm quản lý vận tải (TMS) chuyên nghiệp? → Vì các hệ thống lớn (như SAP, Oracle, Route4Me) chi phí quá đắt (vài chục đến cả trăm triệu), giao diện phức tạp, doanh nghiệp vừa và nhỏ (SME 5–20 xe) không thể với tới.\n"
        "4. Tại sao họ không dùng app gọi xe công nghệ (Lalamove, Ahamove)? → Doanh nghiệp đã đầu tư sẵn xe tải và tài xế riêng của mình. App gọi xe bên ngoài cắt phế hoa hồng rất cao (18–25%) và không giúp doanh nghiệp quản trị đội xe nội bộ.\n"
        "5. Tại sao không ai đo lường phát thải CO₂ trong vận hành hàng ngày? → Vì không có công cụ tính tự động, không ai rảnh rỗi ngồi nhân chia công thức môi trường phức tạp.\n"
        "👉 KẾT LUẬN CHO PLAN (Root Cause): Nguyên nhân gốc rễ là thị trường thiếu một công cụ tinh gọn, chi phí bình dân, mở web lên là chia được tuyến ngay, vừa né được giờ cấm tải đô thị, vừa tự tính luôn lượng CO₂ giảm được theo chuẩn quốc tế mà không cần đầu tư thêm thiết bị đắt tiền."
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
        "Hội đồng Panasonic yêu cầu làm rõ tính mới và lợi thế cạnh tranh bền vững của giải pháp so với những công cụ đang có trên thị trường. Bảng đối chiếu dưới đây làm rõ Innovation Gap:"
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
         "Miễn phí nhưng làm thủ công, tuyến đi zig-zag tốn xăng, dễ nhầm lẫn, không có dữ liệu xanh.",
         "Tự động gom cụm và sắp xếp thứ tự giao hàng bằng thuật toán VRP trong 1 click."),
        ("2. Phần mềm lớn (SAP, Bravo, Fast)",
         "Quá đắt, cài đặt mất vài tháng, chủ yếu quản lý kế toán kho, không chuyên sâu tối ưu lộ trình nội đô.",
         "Tinh gọn cho SME, mở trình duyệt là chạy ngay, chi phí thuê bao tháng cực kỳ bình dân."),
        ("3. App giao hàng (Lalamove, Ahamove)",
         "Chỉ dành cho đơn vãng lai lẻ tẻ, cắt phế hoa hồng cao, không quản lý được đội xe có sẵn của công ty.",
         "Cung cấp công cụ quản trị nội bộ cho chính đội xe và tài xế riêng của doanh nghiệp."),
        ("4. Phần mềm ngoại (Route4Me, LogiNext)",
         "Giá tính bằng USD rất đắt, giao diện tiếng Anh khó dùng cho tài xế, không hiểu quy định cấm tải đô thị VN.",
         "Giao diện thuần Việt, tích hợp sẵn cảnh báo giờ cấm tải TP.HCM (QĐ 23/2018) và chuẩn đo CO₂.")
    ]

    for row_idx, data in enumerate(comp_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table2.cell(row_idx, col_idx)
            cell.paragraphs[0].add_run(text).font.size = Pt(9.5)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

    p_gap = doc.add_paragraph()
    p_gap.paragraph_format.space_before = Pt(8)
    r_gap_title = p_gap.add_run("👉 Hai khoảng trống đổi mới (Innovation Gap) phù hợp tiêu chí Panasonic Green Impact:\n")
    r_gap_title.font.bold = True
    p_gap.add_run(
        "1. Tích hợp kép (Hiệu quả Vận hành + Đo lường CO₂ Thực tế): Phần mềm duy nhất tại Việt Nam vừa giúp doanh nghiệp giảm chi phí nhiên liệu, vừa tự động xuất báo cáo kiểm kê CO₂ chuẩn quốc tế (GLEC / ISO 14083 / GHG Protocol Scope 3) phục vụ cam kết Net Zero chuỗi cung ứng.\n"
        "2. Không phát sinh chi phí phần cứng: Hoạt động 100% trên nền tảng Web & Mobile PWA, tài xế không cần cài app nặng từ kho ứng dụng, doanh nghiệp không phải lắp thêm hộp đen hay thiết bị cảm biến đắt tiền."
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
        "Đề án cần phân định rành mạch 3 nhóm đối tượng để chứng minh mô hình thương mại và tác động xã hội cụ thể:"
    )

    p_cub = doc.add_paragraph()
    p_cub.add_run(
        "• 1. Customers (Người mua / Người trả tiền): Chủ doanh nghiệp vận tải nhỏ, Giám đốc logistics / chuỗi cung ứng / bán lẻ. "
        "Họ trả tiền vì phần mềm giúp tiết kiệm tiền dầu diesel hàng tháng và có báo cáo carbon minh bạch để đáp ứng yêu cầu chuỗi cung ứng xanh của đối tác.\n"
        "• 2. Users (Người trực tiếp thao tác phần mềm):\n"
        "   - Điều phối viên (Dispatcher): Sử dụng Web Console trên máy tính để nạp đơn hàng, tối ưu tuyến và giám sát vận hành.\n"
        "   - Tài xế (Driver): Cầm smartphone mở Web PWA xem lộ trình tuần tự, bấm 'Đến nơi' và 'Đã giao' để hệ thống đồng bộ.\n"
        "• 3. Beneficiaries (Người thụ hưởng tác động môi trường & xã hội):\n"
        "   - Cộng đồng đô thị: Xe tải không chạy lòng vòng giúp giảm ùn tắc giao thông giờ cao điểm, giảm khói bụi độc hại và khí nhà kính.\n"
        "   - Tài xế: Được chia lộ trình hợp lý, không chạy xe rỗng mệt mỏi, an toàn hơn và nâng cao thu nhập.\n"
        "   - Doanh nghiệp sản xuất / phân phối: Kiểm soát được phát thải Scope 3 trong chuỗi cung ứng chặng cuối theo chuẩn quốc tế.\n\n"
        "👉 Ước tính tỷ lệ trùng lặp (% Overlap Rate) cho Plan:\n"
        "- Ở hộ kinh doanh cá thể hoặc đội xe siêu nhỏ (1–2 xe): Chủ xe vừa điều phối vừa trực tiếp lái xe → Tỷ lệ trùng lặp giữa Người mua (Customer) và Người dùng (User) khoảng 30% – 40%.\n"
        "- Ở doanh nghiệp vận tải từ 5 xe trở lên (Phân khúc khách hàng mục tiêu chính): Văn phòng quản lý và tài xế tách biệt → Tỷ lệ trùng lặp là 0%."
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
        "Mô hình kinh doanh tạo tác động (Impact-driven Business Model) phải chứng minh dòng tiền kinh tế và dòng giảm thải môi trường gắn chặt với nhau, hoàn toàn tương thích với triết lý Panasonic GREEN IMPACT:"
    )

    p_flow = doc.add_paragraph()
    p_flow.add_run(
        "Trình bày theo Vòng lặp giá trị nhân quả (Cause-and-Effect Loop):\n\n"
        "1. Can thiệp công nghệ (Tech Intervention): Thuật toán VRP tự động gom cụm đơn hàng, tối ưu lộ trình ngắn nhất và hỗ trợ ghép đơn chiều về.\n"
        "   ↓\n"
        "2. Dòng tác động môi trường (Impact Flow): Cắt giảm quãng đường lãng phí → Giảm lượng dầu diesel tiêu thụ → Trực tiếp giảm phát thải CO₂ ra bầu khí quyển (chuẩn GLEC / IPCC).\n"
        "   ↓\n"
        "3. Giá trị kinh tế cho khách hàng (Economic Value): Mỗi xe tải tiết kiệm được từ 1.5 – 3 triệu đồng tiền dầu thực tế mỗi tháng.\n"
        "   ↓\n"
        "4. Dòng tiền cho dự án (Financial Flow): Khách hàng sẵn sàng trích khoảng 10% – 15% từ chính số tiền tiết kiệm được để trả phí SaaS cho EcoMiles (~299.000đ/xe/tháng). Khách hàng có thặng dư kinh tế ròng ngay từ tháng đầu tiên.\n"
        "   ↓\n"
        "5. Nguồn thu dịch vụ xanh cao cấp: Cung cấp chứng nhận kiểm kê phát thải CO₂ số hóa chuẩn ISO 14083 / GHG Protocol để doanh nghiệp nộp báo cáo ESG cho tập đoàn đa quốc gia."
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
        "Định vị thương hiệu rõ ràng trên Perceptual Map và tuyên ngôn định vị chuẩn quốc tế:"
    )

    p_map = doc.add_paragraph()
    p_map.add_run(
        "A. Bản đồ nhận thức 2 trục (Perceptual Map):\n"
        "• Trục tung (Y): Mức độ đo lường phát thải CO₂ (Dưới là Không đo lường ──> Trên là Tự động đo chuẩn quốc tế GLEC/ISO 14083).\n"
        "• Trục hoành (X): Chi phí & Tính dễ triển khai (Trái là Chi phí cao / Cồng kềnh ──> Phải là Tinh gọn / Chi phí thấp cho SME).\n"
        "• Vị thế các nhóm giải pháp:\n"
        "  - Excel/Zalo: Góc dưới bên phải (Chi phí thấp nhưng hoàn toàn thủ công, 0% khả năng đo lường CO₂).\n"
        "  - SAP / TMS lớn: Góc dưới bên trái (Rất đắt đỏ, triển khai phức tạp, thiếu tính năng đo lường phát thải chặng cuối).\n"
        "  - Route4Me / LogiNext: Góc trên bên trái (Đo lường tốt nhưng giá tiền USD đắt đỏ, không hỗ trợ đặc thù cấm tải Việt Nam).\n"
        "  - ECOMILES: GÓC TRÊN BÊN PHẢI (Vị thế tiên phong độc tôn: Vừa đo lường CO₂ chuẩn quốc tế, vừa tinh gọn, giá bình dân cho doanh nghiệp Việt Nam).\n\n"
        "B. Tuyên ngôn định vị (Positioning Statement):\n"
        "\"Dành cho các doanh nghiệp vận tải và chuỗi phân phối đô thị tại Việt Nam đang tìm kiếm giải pháp cắt giảm chi phí và xanh hóa chuỗi cung ứng, "
        "EcoMiles là nền tảng điều phối tuyến thông minh và kiểm kê CO₂ tự động, "
        "giúp tối ưu quãng đường vận chuyển và tự động xuất dữ liệu phát thải đạt chuẩn quốc tế, "
        "khác với việc điều phối thủ công trên Excel hay các phần mềm ngoại đắt đỏ, "
        "giải pháp của chúng tôi cực kỳ tinh gọn, hiểu sâu quy định giao thông đô thị Việt Nam và triển khai tức thì trên nền tảng Web với chi phí tối ưu.\""
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
        "[LƯU Ý TRUNG THỰC QUAN TRỌNG NHẤT] Giám khảo các cuộc thi sáng tạo bền vững của tập đoàn công nghệ như Panasonic đánh giá rất cao tính chính xác và liêm chính dữ liệu. "
        "Không được viết các số liệu kỳ vọng pilot như thể đã hoàn thành trên quy mô lớn. Nhóm công nghệ phân tách rõ 3 cấp độ dữ liệu để tự tin trình bày:"
    )

    table6 = doc.add_table(rows=4, cols=2)
    table6.alignment = WD_TABLE_ALIGNMENT.CENTER
    table6.cell(0, 0).paragraphs[0].add_run("Cấp độ nhãn dữ liệu").font.bold = True
    table6.cell(0, 1).paragraphs[0].add_run("Ý nghĩa & Minh chứng thực tế của EcoMiles").font.bold = True
    set_cell_background(table6.cell(0, 0), "E2E8F0")
    set_cell_background(table6.cell(0, 1), "E2E8F0")

    labels_data = [
        ("[ĐÃ KIỂM CHỨNG]\n(Đã chạy thực nghiệm trên phần mềm MVP)",
         "• Thuật toán VRP giải thành công kịch bản thực tế 80 đơn hàng tại TP.HCM trên đội xe 10 xe tải.\n"
         "• Thời gian xử lý tối ưu tuyến dưới 1 giây trên nền tảng Cloudflare Edge Serverless.\n"
         "• Tự động phát hiện và cảnh báo các đơn hàng vi phạm khung giờ cấm tải nội đô TP.HCM (QĐ 23/2018/QĐ-UBND).\n"
         "• Đồng bộ dữ liệu trạng thái hai chiều theo thời gian thực giữa Web Console điều hành và Web App tài xế.\n"
         "• Hệ thống hoạt động độc lập không phụ thuộc phần cứng đắt tiền."),
        ("[BENCHMARK NGÀNH]\n(Trích dẫn từ nguồn dữ liệu chính thống)",
         "• Chi phí logistics Việt Nam tương đương 16.8% – 17% GDP (Báo cáo Logistics Việt Nam — Bộ Công Thương).\n"
         "• Vận tải đường bộ chiếm trên 80% tổng phát thải khí nhà kính ngành giao thông (Bộ GTVT).\n"
         "• Tỷ lệ xe tải chạy rỗng chiều về tại Việt Nam trung bình từ 30% đến 35% (Ngân hàng Thế giới & VLA).\n"
         "• Hệ số phát thải đốt cháy dầu diesel đạt 2.68 kg CO₂/lít (chuẩn quốc tế IPCC 2006 & GLEC Framework v3.2)."),
        ("[GIẢ ĐỊNH – CẦN PILOT]\n(Mục tiêu cam kết trong giai đoạn thử nghiệm thực địa)",
         "• Mục tiêu cắt giảm 15% – 25% quãng đường lăn bánh thực tế trong điều kiện giao thông đô thị phức tạp.\n"
         "• Kỳ vọng hạ tỷ lệ xe chạy rỗng chiều về từ 30–35% xuống khoảng 15–20% khi mở rộng mạng lưới ghép đơn.\n"
         "• Dự báo thời gian hoàn vốn đầu tư triển khai từ 1.5 – 2 năm.\n"
         "👉 Lời khuyên khi pitch trước Hội đồng Panasonic: Hãy khẳng định đây là các mục tiêu định lượng đã được thiết lập chặt chẽ cho giai đoạn Pilot sắp tới. Tinh thần trung thực khoa học và cam kết hành động thực chất là chìa khóa chinh phục giám khảo Panasonic GREEN IMPACT!")
    ]

    for row_idx, (col1, col2) in enumerate(labels_data, start=1):
        c1 = table6.cell(row_idx, 0)
        c2 = table6.cell(row_idx, 1)
        c1.paragraphs[0].add_run(col1).font.size = Pt(9.5)
        c2.paragraphs[0].add_run(col2).font.size = Pt(9.5)
        set_cell_margins(c1, top=80, bottom=80, left=100, right=100)
        set_cell_margins(c2, top=80, bottom=80, left=100, right=100)

    # Save to both Panasonic contest folder and root workspace
    out_dir = "docs/contests/PANASONIC_2026"
    os.makedirs(out_dir, exist_ok=True)
    out_path_dir = os.path.join(out_dir, "GOI_Y_TECH_CHO_PLAN_PANASONIC.docx")
    out_path_root = "GOI_Y_TECH_CHO_PLAN_PANASONIC.docx"
    doc.save(out_path_dir)
    doc.save(out_path_root)
    print(f"Successfully saved docx to {out_path_dir} and {out_path_root}")

if __name__ == "__main__":
    create_tech_inputs_panasonic_docx()
