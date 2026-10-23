#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to generate the executive report in DOCX:
BÁO CÁO PHÂN TÍCH CÔNG NGHỆ ECOMILES: LỢI THẾ CẠNH TRANH, ĐIỂM MẠNH (UPSIDES) VÀ ĐIỂM HẠN CHẾ (DOWNSIDES)
Uses python-docx with custom XML cell shading, borders, margins, and callout styles.
"""

import sys
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

def add_callout(doc, text_runs, bg_hex="F8FAFC", border_color="059669"):
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

def style_heading(p, text, level=1):
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    if level == 1:
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Deep Navy
    elif level == 2:
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Emerald Green
    elif level == 3:
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55) # Slate

def main():
    root = Path(__file__).resolve().parent.parent
    out_docx_root = root / "BAO_CAO_PHAN_TICH_CONG_NGHE_UPSIDES_DOWNSIDES_ECOMILES.docx"
    out_docx_audit = root / "docs" / "audit" / "BAO_CAO_PHAN_TICH_CONG_NGHE_UPSIDES_DOWNSIDES_ECOMILES.docx"
    out_docx_audit.parent.mkdir(parents=True, exist_ok=True)

    doc = Document()

    # Page Margins: Normal 1 inch
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # Base Normal Style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(10)
    style_normal.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(4)

    # Title & Metadata
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(2)
    r_main = p_title.add_run("BÁO CÁO PHÂN TÍCH CÔNG NGHỆ ECOMILES (CARGOX)\n")
    r_main.bold = True
    r_main.font.size = Pt(18)
    r_main.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    r_sub = p_title.add_run("ĐIỂM ĐẶC BIỆT, LỢI THẾ CẠNH TRANH, ĐIỂM MẠNH (UPSIDES) & ĐIỂM HẠN CHẾ (DOWNSIDES)\n")
    r_sub.bold = True
    r_sub.font.size = Pt(12.5)
    r_sub.font.color.rgb = RGBColor(0x05, 0x96, 0x69)

    r_meta = p_title.add_run("Định vị Nền tảng Điều hành Logistics Xanh Đô thị | Đối chiếu Abivin, SmartLog, AhaMove, Google Maps\n"
                             "Ngày lập báo cáo: 2026-09-24 | Trạng thái kỹ thuật: Đã kiểm chứng 526/526 Tests Green (Victory Confirmed)")
    r_meta.italic = True
    r_meta.font.size = Pt(9)
    r_meta.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ---------------------------------------------------------
    # TÓM TẮT ĐIỀU HÀNH
    # ---------------------------------------------------------
    add_callout(doc, [
        ("TÓM TẮT ĐIỀU HÀNH DÀNH CHO FOUNDER & BAN GIÁM KHẢO:\n", True, RGBColor(0x0F, 0x17, 0x2A), 10.5),
        ("1. EcoMiles KHÔNG định vị là 'một Google Maps khác' và KHÔNG cố gắng tự phát minh thuật toán tìm đường ngắn nhất đơn lẻ. Vũ khí phòng thủ vững chắc của EcoMiles là Hệ thống 5 tầng công nghệ phân lớp:\n"
         "   • Tầng 1: Phân giải địa chỉ chuẩn Việt Nam thời gian thực (GOFA Places Proxy bảo mật server-side).\n"
         "   • Tầng 2: Đồ thị đường bộ kiểm soát kích thước xe tải (OpenStreetMap + Valhalla / OSRM).\n"
         "   • Tầng 3: Luật cấm tải giờ cao điểm TP.HCM theo Quyết định 23/2018/QĐ-UBND tích hợp trực tiếp vào thuật toán.\n"
         "   • Tầng 4: Động cơ tiêu hao năng lượng vật lý lực kéo GLX-HDT-v1 tính dầu diesel theo tải trọng thực tế từng chặng.\n"
         "   • Tầng 5: Bộ tối ưu hóa điều phối đa mục tiêu Eco-ALNS v2 với biên giới Pareto (Nhanh nhất vs Cân bằng vs Xanh tối đa).\n"
         "2. Về câu hỏi Google Maps: Thuật toán EcoMiles giải quyết 100% việc gom đơn, xếp xe và quyết định thứ tự ghé thăm (Macro-VRP). Google Maps CHỈ là công cụ chuyển tiếp vi mô (Micro-Steering) hỗ trợ tài xế lái xe từng chặng với cảnh báo pháp lý giờ cấm tải trực quan.\n"
         "3. Chi phí tiếp cận bằng 0: Chạy serverless trên Cloudflare Edge + D1, tài xế dùng Web PWA trên điện thoại bất kỳ, không tốn hàng trăm triệu mua phần cứng định vị GPS.", False, RGBColor(0x0F, 0x17, 0x2A), 9.5)
    ], bg_hex="ECFDF5", border_color="059669")

    # ---------------------------------------------------------
    # MỤC 1: ĐIỂM ĐẶC BIỆT CỦA ECOMILES
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "1. CHÚNG TA CÓ GÌ ĐẶC BIỆT? (5 TRỤ CỘT LÕI - CORE MOATS)", level=1)
    
    pillars = [
        ("1. Động cơ tính phát thải và tiêu hao dầu dựa trên vật lý lực kéo động (GLX-HDT-v1):",
         "Trong khi các đối thủ chỉ tính phát thải CO₂ phẳng bằng cách lấy tổng số km nhân với một hệ số trung bình (Tier 1 GLEC), EcoMiles tính toán lực cản cơ học tức thời (lực cản lăn, cản khí động học, độ dốc mặt đường và gia tốc dừng đỗ) dựa trên khối lượng xe cộng với TẢI TRỌNG THỰC TẾ CÒN LẠI TRÊN XE TẠI TỪNG CHẶNG. Giao 500 kg hàng ở Điểm dừng số 1 giúp xe nhẹ đi và tiết kiệm dầu vượt trội ở 9 điểm dừng tiếp theo so với việc giao ngược lại. Đây là bằng chứng toán học xác thực, không greenwashing."),

        ("2. Thuật toán tối ưu thích nghi Eco-ALNS v2 tích hợp sẵn Luật cấm tải TP.HCM:",
         "Thuật toán giải bài toán định tuyến xe tải (VRP) sử dụng các toán tử phá hủy và tái thiết độc quyền: 'worst_fuel_removal' (loại bỏ các điểm dừng ngốn dầu bất hợp lý do chênh lệch tải trọng) và 'ban_window_removal' (tự động loại bỏ các điểm dừng rơi vào khung giờ cấm tải sáng 06:00–09:00 và chiều 16:00–20:00 theo QĐ 23/2018/QĐ-UBND)."),

        ("3. Động cơ ra quyết định đa mục tiêu Pareto (EcoPath) thay vì hàm trọng số gộp phi thực tế:",
         "Hệ thống không cộng gộp km với kg CO₂ (hai đơn vị đo không cùng thứ nguyên). Thay vào đó, người điều hành được chọn giữa các gói cam kết giao hàng minh bạch: Nhanh nhất (SLA +0%), Cân bằng (SLA ≤ +5%), và Xanh tối đa (SLA ≤ +10%) kèm giải trình toán học (why_facts) chi tiết cho từng chuyến xe."),

        ("4. Chuẩn hóa địa chỉ hành chính Việt Nam với GOFA Places Proxy độc quyền:",
         "Tích hợp API GOFA Places trực tiếp qua backend FastAPI với cơ chế bảo mật cấp Enterprise: API key lưu độc quyền ở server-side (.env), không bao giờ rò rỉ ra trình duyệt hay mã nguồn mở. Tự động phân giải cấu trúc địa chỉ phức tạp của Việt Nam (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố) và lưu trữ dữ liệu xuất xứ (provenance) minh bạch."),

        ("5. Kiến trúc Serverless Edge kinh tế vượt trội (Cloudflare Workers + D1 + FastAPI):",
         "Nền tảng vận hành hoàn toàn trên điện toán biên (Edge Computing). Chi phí hạ tầng chỉ vài xu mỗi tháng trong giai đoạn thử nghiệm, cho phép cung cấp dịch vụ SaaS cho doanh nghiệp SME với giá chỉ 300.000 – 500.000 VNĐ/xe/tháng, trong khi các phần mềm truyền thống đòi hỏi chi phí đầu tư ban đầu từ vài chục đến hàng trăm triệu đồng.")
    ]

    for p_title, p_content in pillars:
        p = doc.add_paragraph()
        r1 = p.add_run(f"{p_title}\n")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x03, 0x69, 0xA1)
        r1.font.size = Pt(10)
        r2 = p.add_run(p_content)
        r2.font.size = Pt(9.5)

    # ---------------------------------------------------------
    # MỤC 2: MA TRẬN SO SÁNH ĐỐI THỦ
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "2. MA TRẬN SO SÁNH TOÀN DIỆN VỚI CÁC ĐỐI THỦ CẠNH TRANH", level=1)

    table_data = [
        ["Tiêu chí so sánh", "EcoMiles (CargoX)", "Abivin vRoute", "SmartLog (STM)", "AhaMove / Lalamove", "Google Maps / Fleet Engine"],
        ["Khách hàng mục tiêu", "Đội xe tải đô thị vừa & nhỏ (10-100 xe)", "Tập đoàn FMCG lớn (Unilever, P&G)", "3PLs lớn & trung tâm kho bãi", "Giao hàng C2C/B2C tức thời (Xe máy)", "Lập trình viên / Doanh nghiệp công nghệ"],
        ["Thời gian triển khai", "< 5 phút (Web PWA, Excel)", "3 - 6 tháng (Tích hợp ERP phức tạp)", "1 - 3 tháng (Cấu hình TMS)", "Tức thì (Tải app người dùng)", "Vài tuần (Phải tự code tích hợp)"],
        ["Chi phí & Phần cứng", "0 đ phần cứng (Dùng điện thoại)", "10.000$ - 50.000$+ license/setup", "Hàng chục triệu/tháng + máy chủ", "Thu phí chiết khấu theo cuốc", "Phí API đắt (5$-10$/1k requests)"],
        ["Độ chính xác tính Carbon", "Tier 3 Vật lý lực kéo động (GLX-HDT-v1)", "Tier 1 Hệ số phát thải phẳng (km × EF)", "Nhập tay nhật ký đổ dầu / ODO", "Không có tính năng carbon", "Ước tính thô sơ (Google Carbon API)"],
        ["Luật cấm tải TP.HCM (QĐ 23)", "Tích hợp sẵn trong thuật toán ALNS", "Quy tắc cấu hình doanh nghiệp", "Phụ thuộc kinh nghiệm điều phối", "Chủ yếu xe máy, không hỗ trợ xe tải", "KHÔNG hỗ trợ luật xe tải Việt Nam"],
        ["Thuật toán điều phối", "Eco-ALNS v2 + Biên giới Pareto", "Heuristic VRP (20+ ràng buộc)", "Sắp xếp tuyến cơ bản", "Gán xe gần nhất (Point-to-point)", "Chỉ dẫn đường A->B (Không giải VRP)"],
        ["Kiến trúc hệ thống", "Cloudflare Serverless Edge + D1", "Cloud nặng (AWS/Azure Kubernetes)", "On-premise / VPS truyền thống", "Backend tập trung", "Hạ tầng đóng của Google Cloud"]
    ]

    t = doc.add_table(rows=len(table_data), cols=6)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER

    col_widths = [Inches(1.2), Inches(1.3), Inches(1.1), Inches(1.0), Inches(1.0), Inches(1.0)]

    for row_idx, row in enumerate(t.rows):
        for col_idx, cell in enumerate(row.cells):
            cell.width = col_widths[col_idx]
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            cell_p = cell.paragraphs[0]
            cell_p.paragraph_format.line_spacing = 1.05
            cell_p.paragraph_format.space_after = Pt(0)
            run = cell_p.add_run(table_data[row_idx][col_idx])
            
            if row_idx == 0:
                set_cell_background(cell, "0F172A") # Dark Navy Header
                run.bold = True
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                set_cell_border(cell, bottom={'val': 'single', 'sz': 12, 'color': '059669'})
            else:
                run.font.size = Pt(8)
                if col_idx == 0:
                    set_cell_background(cell, "F1F5F9")
                    run.bold = True
                    run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
                elif col_idx == 1:
                    set_cell_background(cell, "ECFDF5") # Highlight EcoMiles in soft green
                    run.bold = True
                    run.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
                else:
                    if row_idx % 2 == 0:
                        set_cell_background(cell, "F8FAFC")
                    else:
                        set_cell_background(cell, "FFFFFF")
                set_cell_border(cell, bottom={'val': 'single', 'sz': 4, 'color': 'E2E8F0'})

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ---------------------------------------------------------
    # MỤC 3: ĐIỂM MẠNH & LỢI ÍCH VƯỢT TRỘI (UPSIDES)
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "3. ĐIỂM MẠNH & LỢI ÍCH VƯỢT TRỘI (UPSIDES)", level=1)

    upsides = [
        ("1. Tiết kiệm 80-90% thời gian điều phối:",
         "Giải bài toán phức tạp gồm 80 đơn hàng và 10 xe tải với đầy đủ ràng buộc tải trọng và khung giờ giao trong vòng < 5 giây (thay vì 1.5 – 2 giờ lập bảng tính Excel thủ công)."),

        ("2. Giảm 15% – 25% chi phí nhiên liệu diesel thực tế trên đường:",
         "Nhờ chiến lược xếp lịch thông minh (ưu tiên xả các kiện hàng nặng ở đầu hành trình để xe chạy nhẹ tải trên các chặng còn lại) và tối ưu hóa vòng lặp khép kín quay về kho trung tâm."),

        ("3. Rào cản chuyển đổi bằng 0 (Zero Friction Onboarding):",
         "Chủ doanh nghiệp SME không cần mua thiết bị GPS đắt đỏ (tiết kiệm 2 – 5 triệu VNĐ/xe tiền thiết bị). Tài xế chỉ cần mở đường link trên điện thoại (PWA) là nhận lệnh ngay."),

        ("4. Báo cáo kiểm kê khí nhà kính minh bạch chuẩn Nghị định 06/2022/NĐ-CP:",
         "Cung cấp số liệu tiêu thụ nhiên liệu và phát thải CO₂ có thể giải trình toán học (traceable data provenance), đối chiếu nguyên lý kỹ thuật ISO 14083 / GLEC Framework 3.2 để doanh nghiệp vận tải trình khách hàng và kiểm toán ESG."),

        ("5. Triệt tiêu rủi ro tài xế bị phạt do đi vào giờ cấm tải TP.HCM:",
         "Hệ thống cảnh báo và tính toán tự động ngăn chặn xe tải nhẹ (dưới 2.5 tấn) đi vào nội đô TP.HCM trong khung giờ 06h-09h và 16h-20h theo QĐ 23/2018/QĐ-UBND.")
    ]

    for u_title, u_desc in upsides:
        p = doc.add_paragraph()
        r1 = p.add_run(f"• {u_title} ")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
        r1.font.size = Pt(10)
        r2 = p.add_run(u_desc)
        r2.font.size = Pt(9.5)

    # ---------------------------------------------------------
    # MỤC 4: VẤN ĐỀ GOOGLE MAPS
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "4. GIẢI MÃ BẢN CHẤT: CHÚNG TA CÓ ĐANG ĐI QUA GOOGLE MAPS KHÔNG?", level=1)

    add_callout(doc, [
        ("PHÂN ĐỊNH BẢN CHẤT KỸ THUẬT RÕ RÀNG:\n", True, RGBColor(0xDC, 0x26, 0x26), 10.5),
        ("• TỐI ƯU HÓA ĐIỀU PHỐI VĨ MÔ (Macro Routing): 100% LÀ ECOMILES, HOÀN TOÀN KHÔNG DÙNG GOOGLE MAPS.\n"
         "  Thuật toán Eco-ALNS v2 tự tính toán việc chia 80 đơn hàng cho 10 xe, sắp xếp điểm nào đi trước, điểm nào đi sau để tiết kiệm dầu và tránh giờ cấm tải. Google Maps hoàn toàn bất lực và không thể làm được việc này.\n\n"
         "• DẪN ĐƯỜNG TỪNG NGÃ RẼ VI MÔ (Micro Steering): CHUYỂN TIẾP SANG GOOGLE MAPS.\n"
         "  Khi tài xế bấm nút 'Chỉ đường', hệ thống chuyển tọa độ sang Google Maps với cờ ép buộc travelmode=driving&dir_action=navigate (ngăn Google Maps tự ý chỉ đường xe máy ở VN) để dẫn đường 500m cuối đến số nhà khách hàng.\n\n"
         "• RỦI RO & CƠ CHẾ BẢO VỆ:\n"
         "  Google Maps KHÔNG biết luật cấm tải TP.HCM. Do đó trên màn hình tài xế EcoMiles hiển thị thẻ cảnh báo màu hổ phách bắt buộc: 'Google sẽ tính lại tuyến khi mở — đây là dẫn đường ô tô ngoài, không phải tuyến xe tải đã duyệt. Tài xế cần tuân thủ biển báo cấm tải trọng và giờ cấm QĐ 23/2018.'", False, RGBColor(0x0F, 0x17, 0x2A), 9.5)
    ], bg_hex="FFFBEB", border_color="D97706")

    p_road = doc.add_paragraph()
    p_road.paragraph_format.space_before = Pt(8)
    r_road_t = p_road.add_run("Lộ trình 3 giai đoạn để triệt tiêu hoàn toàn sự phụ thuộc vào Google Maps:\n")
    r_road_t.bold = True
    r_road_t.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    roadmaps = [
        ("Giai đoạn 1 (Hiện tại - MVP):", "Handoff Google Maps Ô tô + Thẻ cảnh báo giờ cấm tải + Hiển thị hành lang hành chính chi tiết (Quận/Huyện/Phường). Chi phí triển khai = 0 đ."),
        ("Giai đoạn 2 (Ngắn hạn):", "Ghim điểm nút hành lang (Waypoint Pinning) qua URL Google Maps để ép buộc lộ trình xe phải đi qua các trục đường vành đai cho phép xe tải."),
        ("Giai đoạn 3 (Trung hạn - Enterprise):", "Tích hợp động cơ dẫn đường MapLibre / Valhalla trực tiếp vào ứng dụng di động, có giọng nói tiếng Việt từng ngã rẽ, xóa bỏ hoàn toàn Google Maps.")
    ]
    for rm_step, rm_desc in roadmaps:
        p_rm = doc.add_paragraph()
        r1 = p_rm.add_run(f"  {rm_step} ")
        r1.bold = True
        r1.font.size = Pt(9.5)
        r2 = p_rm.add_run(rm_desc)
        r2.font.size = Pt(9.5)

    # ---------------------------------------------------------
    # MỤC 5: ĐIỂM HẠN CHẾ (DOWNSIDES) & CÁCH KHẮC PHỤC
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "5. CÁC ĐIỂM HẠN CHẾ HIỆN TẠI (DOWNSIDES) VÀ GIẢI PHÁP KHẮC PHỤC", level=1)

    downsides = [
        ("1. Rủi ro Google Maps tính lại tuyến đường xe con:",
         "Hạn chế: Khi tài xế bấm nút chỉ đường, Google Maps chỉ dẫn đường theo xe ô tô con thông thường, không biết chiều cao cầu hay tải trọng đường.\n"
         "Cách khắc phục: Ép cờ travelmode=driving, hiển thị cảnh báo cấm tải bắt buộc, và cung cấp danh sách hành lang tuyến chuẩn để tài xế quan sát."),

        ("2. Mô hình phát thải vật lý giả lập (Chưa gắn cảm biến IoT thực tế):",
         "Hạn chế: Con số tiêu thụ nhiên liệu được tính bằng công thức cơ học lực kéo lý thuyết (GLX-HDT-v1) dựa trên dữ liệu tải trọng và độ dốc đường bộ, chưa đo đếm trực tiếp qua cảm biến OBD-II/CAN-bus gắn trên động cơ xe tải.\n"
         "Cách khắc phục: Đây là chủ đích thiết kế để SME không tốn tiền phần cứng; giai đoạn tiếp theo sẽ hợp tác với đối tác thiết bị giám sát hành trình (hộp đen) hiện có của xe để lấy dữ liệu ODO thực tế đối chiếu."),

        ("3. Chưa có tính năng sàn giao dịch ghép xe chiều về (Backhaul Matching):",
         "Hạn chế: Hiện tại MVP chỉ tối ưu hóa các chuyến xe khép kín (xuất phát từ kho Depot, đi giao các điểm và quay về kho), chưa có mạng lưới kết nối đơn hàng giữa các doanh nghiệp vận tải khác nhau để xóa sổ xe chạy rỗng chiều về.\n"
         "Cách khắc phục: Đây là mục tiêu chiến lược của Giai đoạn 4 trong lộ trình phát triển khi đạt ngưỡng quy mô mạng lưới (Network Effect)."),

        ("4. Phần mềm tham chiếu kỹ thuật, không phải tổ chức cấp chứng chỉ ISO:",
         "Hạn chế: EcoMiles là công cụ phần mềm tính toán bám sát khung phương pháp GLEC 3.2 và ISO 14083, nhưng không có thẩm quyền cấp giấy chứng chỉ ISO 14064/14083 chính thức.\n"
         "Cách khắc phục: Tuyên bố minh bạch trong tài liệu và slide: 'Số liệu kiểm kê khí nhà kính được tính toán chuẩn hóa theo nguyên lý ISO 14083 và GLEC Framework 3.2 để phục vụ báo cáo kiểm kê theo Nghị định 06/2022/NĐ-CP', không gây hiểu lầm cho hội đồng giám khảo.")
    ]

    for d_title, d_desc in downsides:
        p = doc.add_paragraph()
        r1 = p.add_run(f"• {d_title}\n")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0xDC, 0x26, 0x26)
        r1.font.size = Pt(10)
        r2 = p.add_run(d_desc)
        r2.font.size = Pt(9.5)

    # ---------------------------------------------------------
    # MỤC 6: KỊCH BẢN ĐỐI ĐÁP PITCHING CHIẾN THẮNG
    # ---------------------------------------------------------
    style_heading(doc.add_paragraph(), "6. KỊCH BẢN ĐỐI ĐÁP PITCHING & CHINH PHỤC BAN GIÁM KHẢO (WINNING Q&A)", level=1)

    qa_list = [
        ("Câu hỏi 1 (Về Google Maps):",
         "“Nếu tài xế bấm nút dẫn đường mà mở Google Maps, thì Google sẽ tự tính lại đường đi. Lỡ Google chỉ vào đường cấm tải thì thuật toán tối ưu của các bạn còn tác dụng gì?”",
         "Câu trả lời chiến thắng:",
         "“Dạ thưa Ban Giám Khảo, cần phân định rạch ròi giữa Tối ưu hóa điều phối vĩ mô (Macro-VRP) và Dẫn đường vi mô (Micro-Steering):\n"
         "1. Thuật toán Eco-ALNS v2 của chúng em giải quyết bài toán lớn nhất mà Google Maps hoàn toàn bất lực: phân bổ 80 đơn hàng cho 10 xe và sắp xếp thứ tự dừng đỗ tránh hoàn toàn 2 khung giờ cấm tải của TP.HCM.\n"
         "2. Ở giai đoạn MVP này, để doanh nghiệp SME không phải tốn hàng trăm triệu mua phần cứng chuyên dụng, chúng em dùng cơ chế chuyển tiếp ô tô kèm thẻ cảnh báo cấm tải trực quan.\n"
         "3. Trong giai đoạn 2, chúng em sẽ dùng cơ chế Ghim điểm nút hành lang (Waypoint Pinning) ép Google Maps phải chạy trên các trục vành đai đã duyệt, và giai đoạn 3 sẽ tích hợp động cơ dẫn đường MapLibre nhúng độc quyền trong ứng dụng.”"),

        ("Câu hỏi 2 (Về con số 88% giảm CO₂):",
         "“Các bạn tuyên bố giảm tới 88% lượng phát thải CO₂. Con số này có thực tế không hay chỉ là phóng đại (overclaim)?”",
         "Câu trả lời chiến thắng:",
         "“Dạ thưa Ban Giám Khảo, con số 88% là kết quả thử nghiệm mô phỏng (Simulation Benchmark) trên tập 80 đơn hàng chuẩn TP.HCM khi so sánh lộ trình tối ưu Eco-ALNS với kịch bản điều phối thủ công chạy zig-zag không gom cụm.\n"
         "Trong vận hành thực địa của các doanh nghiệp vận tải đô thị, mức tiết kiệm nhiên liệu và phát thải kỳ vọng thực tế đạt từ 15% đến 25%, chủ yếu đến từ việc ưu tiên xả các đơn hàng nặng ở đầu chuyến đi giúp giảm tải trọng xe trên toàn bộ hành trình còn lại.”"),

        ("Câu hỏi 3 (Về đối thủ Abivin và SmartLog):",
         "“Thị trường đã có Abivin vRoute và SmartLog rất mạnh, EcoMiles làm sao cạnh tranh được?”",
         "Câu trả lời chiến thắng:",
         "“Dạ thưa Ban Giám Khảo, Abivin và SmartLog là những giải pháp Enterprise đắt đỏ dành cho các tập đoàn lớn như Unilever với chi phí hàng chục nghìn USD và mất 3-6 tháng triển khai. Ngược lại, tại Việt Nam có hơn 34.000 doanh nghiệp vận tải vừa và nhỏ (SME) bị bỏ lại phía sau vì không có tiền mua phần mềm cồng kềnh.\n"
         "EcoMiles là nền tảng SaaS tinh gọn đầu tiên ứng dụng mô hình Serverless Edge, giúp SME đưa vào sử dụng ngay sau 5 phút với chi phí chỉ vài trăm nghìn đồng/xe/tháng mà vẫn sở hữu thuật toán tính phát thải chuẩn vật lý Tier 3 và kiểm soát luật cấm tải TP.HCM.”")
    ]

    for q_num, q_text, a_title, a_text in qa_list:
        add_callout(doc, [
            (f"{q_num}\n", True, RGBColor(0xDC, 0x26, 0x26), 10),
            (f"{q_text}\n\n", True, RGBColor(0x0F, 0x17, 0x2A), 9.5),
            (f"{a_title}\n", True, RGBColor(0x05, 0x96, 0x69), 10),
            (f"{a_text}", False, RGBColor(0x0F, 0x17, 0x2A), 9.5)
        ], bg_hex="F8FAFC", border_color="0284C7")
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Save to both destinations
    doc.save(str(out_docx_root))
    doc.save(str(out_docx_audit))

    print(f"Successfully generated Vietnamese Technology Analysis DOCX files:")
    print(f"  1. {out_docx_root}")
    print(f"  2. {out_docx_audit}")

if __name__ == "__main__":
    main()
