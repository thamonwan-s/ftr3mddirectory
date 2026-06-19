// header.js
const headerHTML = `
  <div id="main-header-wrapper">
    <div class="w-full bg-[#333333] flex items-center justify-between px-4" style="height: 24px;">
      <span class="text-white" style="font-size: 6pt; letter-spacing: 0.5px;">FTR3MD's</span>
      <nav class="flex items-center space-x-3">
        <a href="index.html" class="text-white hover:text-gray-300" style="font-size: 6pt;">Home</a>
        <a href="flights.html" class="text-white hover:text-gray-300" style="font-size: 6pt;">Flights</a>
        <a href="#" class="text-white hover:text-gray-300" style="font-size: 6pt;">Schedule</a>
      </nav>
    </div>
    <nav aria-label="Breadcrumb" class="w-full px-4 py-2 border-b border-gray-100">
      <ol id="breadcrumb" class="flex items-center space-x-2" style="font-size: 6pt; color: #888; text-transform: uppercase;"></ol>
    </nav>
  </div>
`;

const footerHTML = `
  <footer id="main-footer" class="w-full bg-[#333333] py-6 mt-10 text-center">
    <div class="text-white font-bold" style="font-size: 8pt;">FTR3MD's DIRECTORY</div>
    <div class="text-gray-400 mt-1" style="font-size: 6pt;">© 2026 ALL RIGHTS RESERVED</div>
  </footer>
`;

// ฟังก์ชันนี้มีไว้เพื่อให้หน้า HTML ที่เรียก injectHeader() ไม่ Error
function injectHeader() {
    const existing = document.getElementById('main-header-wrapper');
    if (existing) existing.remove();
    const headerElement = document.createElement('div');
    headerElement.innerHTML = headerHTML;
    document.body.prepend(headerElement);
}

// ฟังก์ชันฉีด Layout ทั้งหมด (Header + Footer)
function injectLayout() {
    injectHeader(); // ใส่ Header
    
    // ใส่ Footer
    const existingFooter = document.getElementById('main-footer');
    if (!existingFooter) {
        const footerElement = document.createElement('div');
        footerElement.innerHTML = footerHTML;
        document.body.appendChild(footerElement);
    }
}

// จัดการ Favicon และสั่งรัน layout ทันทีที่โหลด
// ในส่วนของ (function() { ... }) ของ header.js

function injectLayout() {
    // 1. สร้าง Wrapper ขึ้นมาใหม่ เพื่อคุมเนื้อหาทั้งหมด
    const wrapper = document.createElement('div');
    wrapper.id = "page-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.minHeight = "100vh";

    // 2. ย้ายทุกอย่างที่มีใน body (ยกเว้น script) เข้าไปใน wrapper
    const bodyChildren = Array.from(document.body.childNodes);
    bodyChildren.forEach(node => {
        if (node.nodeName !== 'SCRIPT') {
            wrapper.appendChild(node);
        }
    });
    
    // 3. เคลียร์ body แล้วใส่ wrapper ลงไปแทน
    document.body.innerHTML = ''; // ล้างของเก่า
    document.body.appendChild(wrapper);

    // 4. ใส่ Header
    const header = document.createElement('div');
    header.innerHTML = headerHTML;
    wrapper.prepend(header);

    // 5. ใส่ Footer (ให้มันไปอยู่ท้ายสุดของ wrapper)
    const footer = document.createElement('footer');
    footer.id = "main-footer";
    footer.className = "w-full bg-[#333333] py-6 mt-auto text-center"; // mt-auto สำคัญมาก
    footer.innerHTML = `
        <div class="text-white font-bold" style="font-size: 8pt;">FTR3MD's FLIGHT LOG</div>
        <div class="text-gray-400 mt-1" style="font-size: 6pt;">© 2026 ALL RIGHTS RESERVED</div>
    `;
    wrapper.appendChild(footer);
}
