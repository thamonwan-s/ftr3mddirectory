// header.js
const headerHTML = `
  <div class="w-full bg-[#333333] flex items-center justify-between px-4" style="height: 24px;">
    <span class="text-white" style="font-size: 6pt; letter-spacing: 0.5px;">FTR3MD's</span>
    <nav class="flex items-center space-x-3">
      <a href="index.html" class="text-white hover:text-gray-300" style="font-size: 6pt;">Home</a>
      <a href="flights.html" class="text-white hover:text-gray-300" style="font-size: 6pt;">Flights</a>
      <a href="#" class="text-white hover:text-gray-300" style="font-size: 6pt;">Schedule</a>
    </nav>
  </div>

  <nav aria-label="Breadcrumb" class="w-full px-4 py-2 border-b border-gray-100">
    <ol id="breadcrumb" class="flex items-center space-x-2" style="font-size: 6pt; color: #888; text-transform: uppercase;">
    </ol>
  </nav>
`;

// ฟังก์ชันสำหรับใส่ Header เข้าไป
function injectHeader() {
    const headerElement = document.createElement('div');
    headerElement.innerHTML = headerHTML;
    
    // ใส่ไว้บนสุดของ body ทันที
    document.body.prepend(headerElement);
}
