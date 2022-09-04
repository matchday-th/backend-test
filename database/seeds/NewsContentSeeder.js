'use strict'
const NewsContent = use('App/Models/NewsContent')

class NewsContentSeeder {
  async run () {
    await NewsContent.createMany([
      {
        text: '<b>ไม่เพียงแค่สินค้าคุณภาพ แต่การบริการต้องดีเยี่ยม duck service by duck group ให้บริการครบวงจรสำหรับธุรกิจ Retail Automation<b>',
        photo: 'https://static.wixstatic.com/media/ae666b_aa86d0b8d29f478f8bc0505cce520c88~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_aa86d0b8d29f478f8bc0505cce520c88~mv2.webp'
      },
      {
          text: 'duck service by duck group ชี้ความสำเร็จที่แท้จริง วัดได้จากความพึงพอใจของลูกค้า',
          photo: 'https://static.wixstatic.com/media/ae666b_ca63e11b04dc4ba9b2b0e06d3e0d273e~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_ca63e11b04dc4ba9b2b0e06d3e0d273e~mv2.webp'
      },
      {
          text: 'เมื่อสภาพแวดล้อมทางธุรกิจเปลี่ยนแปลงอยู่เสมอ การวิ่งตามกระแสเทคโนโลยีหรือกระแสสังคมสำหรับ duck service by duck group เรามองว่าอาจไม่ใช่จุดหมายสู่ความสำเร็จที่แท้จริงเท่าไหร่ สิ่งสำคัญที่ผู้ประกอบการทั้งหลายควรให้ความสำคัญและมุ่งเน้นพัฒนาอยู่เสมอ คือ การบริการ (service) ทั้งก่อน ระหว่าง และหลังการขาย เป็นกุญแจที่ไขไปสู่ความสำเร็จที่ยั่งยืนได้มากกว่า',
          photo: 'https://static.wixstatic.com/media/ae666b_f4528a1604554fed89c2b6bff883364c~mv2.jpg/v1/fill/w_1402,h_737,al_c,q_90/ae666b_f4528a1604554fed89c2b6bff883364c~mv2.webp'
      },
      {
          text: 'duck service by duck group มุ่งมั่นพัฒนาบริการของเราอยู่เสมอ และเราพยายามพัฒนาอย่างต่อเนื่องให้ครบวงจรที่สุด เป้าหมายสำคัญคือ.. “ความพึงพอใจของลูกค้า” เพราะนอกเหนือจากสินค้าที่มีคุณภาพแล้ว การบริการน่าจะเป็นสิ่งสำคัญอย่างหนึ่งที่ช่วยเพิ่มศักยภาพทางการแข่งขัน และอาจจะเป็นจุดสร้างความแตกต่างที่เด่นชัดที่สุด ในการแข่งขันเมื่อถูกเปรียบเทียบกับคู่แข่งในตลาดได้',
          photo: 'https://static.wixstatic.com/media/ae666b_4e0a097f8b52477ca84a7ea984446dbd~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_4e0a097f8b52477ca84a7ea984446dbd~mv2.webp'
      },
      {
          text: 'เรามองว่าการแข่งขันในคุณภาพสินค้าอาจทัดเทียมกันได้ด้วยเทคโนโลยีหรือเงินทุนที่มี และทางด้านลูกค้า ก็อาจเลือกซื้อสินค้าตามกำลังซื้อของแต่ละคน แน่นอนว่าในตลาดการแข่งขัน ราคาขายย่อมสัมพันธ์กับต้นทุนและคุณภาพ ซึ่งในปัจจุบันเทคโนโลยีสารสนเทศ สื่อโซเชียลต่างๆ ช่วยให้ลูกค้าหาคำตอบในเรื่องคุณภาพของสินค้าได้ แต่ลูกค้าในปัจจุบันกลับไม่ได้ต้องการแค่นั้น เราพบว่าสิ่งที่ลูกค้าค้นหาคำตอบเพื่อประกอบการพิจารณาก่อนซื้อ โดยเฉพาะสินค้าที่มีราคาสูง กลับกลายเป็นการให้บริการหรือการบริการหลังการขาย และนี่อาจเป็นข้อสรุปในการตัดสินใจเลือกซื้อของลูกค้าก็เป็นได้ ',
          photo: 'https://static.wixstatic.com/media/ae666b_00b7a68f82bb4d1ba72e534c91def324~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_00b7a68f82bb4d1ba72e534c91def324~mv2.webp'
      },
      {
          photo: 'https://static.wixstatic.com/media/ae666b_bdc0ee494fe74d58a3a13643255cf3d0~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_bdc0ee494fe74d58a3a13643255cf3d0~mv2.webp'
      },
      {
          text: 'เราเชื่อว่าการบริการที่สร้างความประทับใจให้กับลูกค้าลอกเลียนแบบกันได้ยากยิ่งกว่าการผลิตสินค้า และประสบการณ์ที่ลูกค้าได้รับในการใช้บริการแต่ละครั้ง ในแต่ละคนก็อาจแตกต่างกันไป สำหรับ duck service by duck group เราไม่อาจที่จะปฏิเสธถึงความบกพร่องเสียหายในตัวสินค้าได้ ซึ่งไม่ได้หมายความว่าสินค้าที่เสื่อมสภาพ ชำรุด เสียหาย จะไม่ใช่สินค้าคุณภาพ แต่เป็นธรรมดาที่สินค้าจะต้องมีการเสื่อมสภาพตามกาลเวลา ตามอายุการใช้งาน แม้จะเป็นสินค้าใหม่ ก็ยังต้องมีการบำรุงรักษา เพื่อคงสภาพหรือยืดอายุการใช้งาน เหล่านี้จึงเป็นประตูไปสู่การให้บริการของเรา',
          photo: 'https://static.wixstatic.com/media/ae666b_a1ea97eab70c41808b69529803f703eb~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_a1ea97eab70c41808b69529803f703eb~mv2.webp'
      },
      {
          text: 'list. ขนส่ง list. ติดตั้ง list. ดูแลรักษา list. ซ่อม/บำรุง',
          photo: 'https://static.wixstatic.com/media/ae666b_814dc9b44db74a8c8a5aae9720750bc3~mv2.png/v1/fill/w_1402,h_737,al_c,q_95/ae666b_814dc9b44db74a8c8a5aae9720750bc3~mv2.webp'
      },
      {
          text: '<b>ยึดมั่นในมาตรฐาน บริการด้วยใจ พร้อมแก้ไขและพัฒนาอยู่เสมอ duck service by duck group ให้บริการครบวงจรสำหรับธุรกิจ Retail Automation</b>'
      },
      {
          align: 'start',
          text: `สนใจเยี่ยมชมอาณาจักร duck group <br>
          Website : <a href="https://www.duckgroup.co/home">https://www.duckgroup.co/home</a><br>
          Facebook duck group : <a href="https://www.facebook.com/Duck-group-102080255803833">https://www.facebook.com/Duck-group-102080255803833</a><br>
          Facebook duck vending & duck coin changer : <a href="https://www.facebook.com/CIRBOX/">https://www.facebook.com/CIRBOX/</a><br>
          Facebook duck wash : <a href="https://www.facebook.com/proudlaundrysolution">https://www.facebook.com/proudlaundrysolution</a><br>
          Facebook duck pay : <a href="https://www.facebook.com/2EnhanceCorporation/">https://www.facebook.com/2EnhanceCorporation/</a><br>
          Facebook duck store : <a href="https://www.facebook.com/DevourThailand/">https://www.facebook.com/DevourThailand/</a><br>
          LINE Official : @duckgroup หรือ <a href="https://lin.ee/JqHLLZD">https://lin.ee/JqHLLZD</a>`
      },
      {
          align: 'start',
          text: `ติดต่อการตลาด : คุณศิริดาวัลย์ วงศ์ธาดาชัย  siridawan.wo@duckgroup.co<br>
          ติดต่อฝ่ายขาย : คุณกานติศา เสถียร  kantisa.st@duckgroup.co<br>
          ติดต่อฝ่ายพัฒนาธุรกิจ,นักลงทุนสัมพันธ์ : คุณณรงค์ฤทธิ์ จารุเกษม narongrit.ch@duckgroup.co<br>`
      }
    ])
  }
}

module.exports = NewsContentSeeder
