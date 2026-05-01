require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { get, run, exec } = require('./helper');

const force = process.argv.includes('--force');

async function clearDatabase() {
  await exec('PRAGMA foreign_keys = OFF');
  await run('DELETE FROM visits');
  await run('DELETE FROM journey_plan_customers');
  await run('DELETE FROM journey_plans');
  await run('DELETE FROM route_customers');
  await run('DELETE FROM routes');
  await run('DELETE FROM customers');
  await run('DELETE FROM vehicles');
  await run('DELETE FROM warehouses');
  await run('DELETE FROM users');
  await run('DELETE FROM companies');
  await exec('PRAGMA foreign_keys = ON');
}

async function seed() {
  const existing = await get('SELECT COUNT(*) as count FROM companies');
  if (existing.count > 0 && !force) {
    console.log('Database already seeded. Use --force to reseed.');
    return;
  }

  await exec('BEGIN TRANSACTION');

  try {
    if (force) await clearDatabase();

    const today    = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // ─── Companies (7) ──────────────────────────────────────────────────
    const hulId    = uuidv4(), itcId    = uuidv4(), nestleId = uuidv4();
    const britId   = uuidv4(), daburId  = uuidv4(), gcplId   = uuidv4(), maricoId = uuidv4();

    for (const [id, name, code] of [
      [hulId,    'Hindustan Unilever Limited',       'HUL'],
      [itcId,    'ITC Limited',                      'ITC'],
      [nestleId, 'Nestle India Limited',             'NESTLE'],
      [britId,   'Britannia Industries Limited',     'BRIT'],
      [daburId,  'Dabur India Limited',              'DABUR'],
      [gcplId,   'Godrej Consumer Products Limited', 'GCPL'],
      [maricoId, 'Marico Limited',                   'MARICO'],
    ]) {
      await run('INSERT INTO companies (id, name, code) VALUES (?, ?, ?)', [id, name, code]);
    }

    // ─── Warehouses ─────────────────────────────────────────────────────
    const wh = (id, name, code, address, city, state, compId) =>
      run(
        'INSERT INTO warehouses (id, name, code, address, city, state, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, code, address, city, state, compId],
      );

    // HUL — 6 warehouses
    const hW1 = uuidv4(), hW2 = uuidv4(), hW3 = uuidv4();
    const hW4 = uuidv4(), hW5 = uuidv4(), hW6 = uuidv4();
    await wh(hW1, 'HUL Mumbai Central Depot',       'HUL-MUM-01', 'Plot 14, MIDC Andheri East',                  'Mumbai',    'Maharashtra',   hulId);
    await wh(hW2, 'HUL Delhi NCR Distribution Hub', 'HUL-DEL-01', 'Survey 22, Udyog Vihar Phase IV, Gurugram',   'Gurugram',  'Haryana',       hulId);
    await wh(hW3, 'HUL Bengaluru Distribution Hub', 'HUL-BLR-01', 'No. 45, Peenya Industrial Area Phase II',     'Bengaluru', 'Karnataka',     hulId);
    await wh(hW4, 'HUL Chennai Regional Depot',     'HUL-CHE-01', 'Plot 7, Ambattur Industrial Estate',          'Chennai',   'Tamil Nadu',    hulId);
    await wh(hW5, 'HUL Kolkata Warehouse',          'HUL-KOL-01', '34, Taratala Road, Garden Reach',             'Kolkata',   'West Bengal',   hulId);
    await wh(hW6, 'HUL Hyderabad Distribution Hub', 'HUL-HYD-01', 'Plot 88, IDA Pashamylaram, Medak 502307',     'Hyderabad', 'Telangana',     hulId);

    // ITC — 5 warehouses
    const iW1 = uuidv4(), iW2 = uuidv4(), iW3 = uuidv4(), iW4 = uuidv4(), iW5 = uuidv4();
    await wh(iW1, 'ITC Kolkata Mother Depot',        'ITC-KOL-01', '37, Gurusaday Road',                         'Kolkata',   'West Bengal',   itcId);
    await wh(iW2, 'ITC Mumbai Distribution Hub',     'ITC-MUM-01', 'B-12, TTC Industrial Area, Navi Mumbai',     'Navi Mumbai','Maharashtra',  itcId);
    await wh(iW3, 'ITC Delhi Regional Hub',          'ITC-DEL-01', '11, Najafgarh Road Industrial Area',         'New Delhi',  'Delhi',        itcId);
    await wh(iW4, 'ITC Hyderabad Depot',             'ITC-HYD-01', 'Plot 102, IDA Nacharam',                     'Hyderabad', 'Telangana',     itcId);
    await wh(iW5, 'ITC Pune Regional Centre',        'ITC-PUN-01', 'Gat No. 314, Chakan Industrial Area',        'Pune',      'Maharashtra',   itcId);

    // Nestle — 4 warehouses
    const nW1 = uuidv4(), nW2 = uuidv4(), nW3 = uuidv4(), nW4 = uuidv4();
    await wh(nW1, 'Nestle Mumbai Regional Depot',    'NESTLE-MUM-01', '3/A, LBS Marg, Vikhroli West',            'Mumbai',    'Maharashtra',   nestleId);
    await wh(nW2, 'Nestle Delhi Distribution Hub',   'NESTLE-DEL-01', 'A-8, Sector 4, Noida 201301',             'Noida',     'Uttar Pradesh', nestleId);
    await wh(nW3, 'Nestle Gurgaon Distribution Hub', 'NESTLE-GGN-01', 'Plot 23, Sector 37, Gurugram 122001',     'Gurugram',  'Haryana',       nestleId);
    await wh(nW4, 'Nestle Pune Warehouse',           'NESTLE-PUN-01', 'Plot C-14, Bhosari Industrial Estate',    'Pune',      'Maharashtra',   nestleId);

    // Britannia — 5 warehouses
    const bW1 = uuidv4(), bW2 = uuidv4(), bW3 = uuidv4(), bW4 = uuidv4(), bW5 = uuidv4();
    await wh(bW1, 'Britannia Bengaluru Central Depot','BRIT-BLR-01', '8th km, Old Madras Road, Krishnarajapuram','Bengaluru', 'Karnataka',     britId);
    await wh(bW2, 'Britannia Delhi Distribution Hub', 'BRIT-DEL-01', '52, Lawrence Road Industrial Area',        'New Delhi', 'Delhi',         britId);
    await wh(bW3, 'Britannia Chennai Hub',            'BRIT-CHE-01', 'No. 18, Chennai Bypass Road, Ambattur',    'Chennai',   'Tamil Nadu',    britId);
    await wh(bW4, 'Britannia Kolkata Warehouse',      'BRIT-KOL-01', '130, Purba Barisha Road',                  'Kolkata',   'West Bengal',   britId);
    await wh(bW5, 'Britannia Mumbai Depot',           'BRIT-MUM-01', 'Unit 6, Bhiwandi Logistics Park',          'Bhiwandi',  'Maharashtra',   britId);

    // Dabur — 4 warehouses
    const dW1 = uuidv4(), dW2 = uuidv4(), dW3 = uuidv4(), dW4 = uuidv4();
    await wh(dW1, 'Dabur Delhi NCR Hub',              'DABUR-GGN-01', 'Sector 67, Institutional Area, Gurugram','Gurugram',  'Haryana',       daburId);
    await wh(dW2, 'Dabur Noida Warehouse',            'DABUR-NOI-01', 'A-83, Sector 64, Noida 201301',          'Noida',     'Uttar Pradesh', daburId);
    await wh(dW3, 'Dabur Mumbai Depot',               'DABUR-MUM-01', 'Survey 8, Bhiwandi Warehouse Cluster',   'Bhiwandi',  'Maharashtra',   daburId);
    await wh(dW4, 'Dabur Ahmedabad Centre',           'DABUR-AMD-01', 'Survey 102, GIDC Vatva',                 'Ahmedabad', 'Gujarat',       daburId);

    // GCPL — 4 warehouses
    const gW1 = uuidv4(), gW2 = uuidv4(), gW3 = uuidv4(), gW4 = uuidv4();
    await wh(gW1, 'GCPL Mumbai Central Hub',          'GCPL-MUM-01', 'Eastern Express Highway, Vikhroli East',  'Mumbai',    'Maharashtra',   gcplId);
    await wh(gW2, 'GCPL Delhi Distribution Depot',    'GCPL-DEL-01', '14, IMT Manesar, Gurugram 122051',        'Gurugram',  'Haryana',       gcplId);
    await wh(gW3, 'GCPL Bengaluru Warehouse',         'GCPL-BLR-01', 'Plot 67, Bommasandra Industrial Area',    'Bengaluru', 'Karnataka',     gcplId);
    await wh(gW4, 'GCPL Chennai Centre',              'GCPL-CHE-01', 'No. 5, Ambattur Industrial Estate',       'Chennai',   'Tamil Nadu',    gcplId);

    // Marico — 4 warehouses
    const mW1 = uuidv4(), mW2 = uuidv4(), mW3 = uuidv4(), mW4 = uuidv4();
    await wh(mW1, 'Marico Mumbai HQ Depot',           'MARICO-MUM-01', 'Marathon Innova, Lower Parel',          'Mumbai',    'Maharashtra',   maricoId);
    await wh(mW2, 'Marico Delhi Distribution Hub',    'MARICO-DEL-01', '14A, Najafgarh Road Industrial Area',   'New Delhi', 'Delhi',         maricoId);
    await wh(mW3, 'Marico Kolkata Warehouse',         'MARICO-KOL-01', '8, Camac Street',                       'Kolkata',   'West Bengal',   maricoId);
    await wh(mW4, 'Marico Ahmedabad Centre',          'MARICO-AMD-01', '202, GIDC Naroda',                      'Ahmedabad', 'Gujarat',       maricoId);

    // ─── Vehicles ───────────────────────────────────────────────────────
    const veh = (id, name, plate, compId) =>
      run('INSERT INTO vehicles (id, name, plate_number, company_id) VALUES (?, ?, ?, ?)', [id, name, plate, compId]);

    const hulV1 = uuidv4(), hulV2 = uuidv4(), hulV3 = uuidv4(), hulV4 = uuidv4();
    await veh(hulV1, 'HUL Mumbai West Van 01',    'MH-01-AB-1234', hulId);
    await veh(hulV2, 'HUL Mumbai Central Van 02', 'MH-01-CD-5678', hulId);
    await veh(hulV3, 'HUL Mumbai North Van 03',   'MH-01-EF-9012', hulId);
    await veh(hulV4, 'HUL Spare Van 04',          'MH-01-GH-3456', hulId);

    const itcV1 = uuidv4(), itcV2 = uuidv4(), itcV3 = uuidv4(), itcV4 = uuidv4();
    await veh(itcV1, 'ITC Thane Zone Van 01',     'MH-04-KL-7891', itcId);
    await veh(itcV2, 'ITC Navi Mumbai Van 02',    'MH-04-MN-2345', itcId);
    await veh(itcV3, 'ITC Kurla Zone Van 03',     'MH-04-OP-6789', itcId);
    await veh(itcV4, 'ITC Spare Van 04',          'MH-04-QR-0123', itcId);

    // ─── Users ──────────────────────────────────────────────────────────
    const adminId  = uuidv4(), sales1Id = uuidv4(), sales2Id = uuidv4();
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    const salesHash = bcrypt.hashSync('Sales@123', 10);

    await run('INSERT INTO users (id, username, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [adminId,  'admin_test',      adminHash, 'Rajesh Kumar Sharma', 'admin',          '+91-98765-00001']);
    await run('INSERT INTO users (id, username, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [sales1Id, 'vansales_test01', salesHash, 'Amit Singh',          'van_sales_user', '+91-98765-00002']);
    await run('INSERT INTO users (id, username, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [sales2Id, 'vansales_test02', salesHash, 'Priya Mehta',         'van_sales_user', '+91-98765-00003']);

    // ─── Customer helper ────────────────────────────────────────────────
    const insertCustomers = async (rows) => {
      const ids = [];
      for (const [name, code, address, phone, route, compId, whId] of rows) {
        const id = uuidv4();
        ids.push(id);
        await run(
          `INSERT INTO customers
           (id, name, customer_code, address, contact_number, location_route, company_id, warehouse_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, name, code, address, phone, route, compId, whId],
        );
      }
      return ids;
    };

    // ─── HUL Customers ──────────────────────────────────────────────────

    // Route 1 — Mumbai West (Bandra / Khar / Santacruz / Juhu) — 7 stops
    const hulWestIds = await insertCustomers([
      ['Babani Provision Store',     'HUL-CUST-W01', '14, Chapel Road, Bandra West, Mumbai 400050',        '+91-98201-11001', 'Mumbai West — Bandra/Khar', hulId, hW1],
      ['Fernandes General Store',    'HUL-CUST-W02', '22, Turner Road, Bandra West, Mumbai 400050',        '+91-98201-11002', 'Mumbai West — Bandra/Khar', hulId, hW1],
      ['Siddharth Kirana Centre',    'HUL-CUST-W03', '5, Linking Road, Khar West, Mumbai 400052',          '+91-98201-11003', 'Mumbai West — Khar',        hulId, hW1],
      ['Mehta Brothers Supermarket', 'HUL-CUST-W04', '8, S.V. Road, Santacruz West, Mumbai 400054',        '+91-98201-11004', 'Mumbai West — Santacruz',   hulId, hW1],
      ['New Maharashtra Stores',     'HUL-CUST-W05', '3, Juhu Tara Road, Juhu, Mumbai 400049',             '+91-98201-11005', 'Mumbai West — Juhu',        hulId, hW1],
      ['Gupta Departmental Store',   'HUL-CUST-W06', '17, 14th Road, Khar West, Mumbai 400052',            '+91-98201-11006', 'Mumbai West — Khar',        hulId, hW1],
      ['Anand Provision Mart',       'HUL-CUST-W07', '29, Hill Road, Bandra West, Mumbai 400050',          '+91-98201-11007', 'Mumbai West — Bandra',      hulId, hW1],
    ]);

    // Route 2 — Mumbai Central (Dadar / Mahim / Parel / Worli) — 6 stops
    const hulCentralIds = await insertCustomers([
      ['Shantilal General Merchants','HUL-CUST-C01', '8, Dadar TT Circle, Dadar West, Mumbai 400028',      '+91-98201-22001', 'Mumbai Central — Dadar',    hulId, hW1],
      ['Narayan Kirana Bhandar',     'HUL-CUST-C02', '15, Lady Jamshedji Road, Mahim, Mumbai 400016',      '+91-98201-22002', 'Mumbai Central — Mahim',    hulId, hW1],
      ['Krishna Traders',            'HUL-CUST-C03', '41, Dr. Ambedkar Road, Parel, Mumbai 400012',        '+91-98201-22003', 'Mumbai Central — Parel',    hulId, hW1],
      ['Shree Mahalaxmi Stores',     'HUL-CUST-C04', '7, Worli Naka, Worli, Mumbai 400018',                '+91-98201-22004', 'Mumbai Central — Worli',    hulId, hW1],
      ['Bombay Wholesale Grocers',   'HUL-CUST-C05', '12, Senapati Bapat Marg, Lower Parel, Mumbai 400013','+91-98201-22005', 'Mumbai Central — Lower Parel', hulId, hW1],
      ['Rajshree Provision Store',   'HUL-CUST-C06', '3, Gokhale Road North, Dadar West, Mumbai 400028',   '+91-98201-22006', 'Mumbai Central — Dadar',    hulId, hW1],
    ]);

    // Route 3 — Mumbai North (Andheri / Goregaon / Malad / Kandivali) — 6 stops
    const hulNorthIds = await insertCustomers([
      ['Malhotra Kirana Centre',     'HUL-CUST-N01', '4, Andheri Market, Andheri West, Mumbai 400058',     '+91-98201-33001', 'Mumbai North — Andheri',    hulId, hW1],
      ['Sun Shine General Store',    'HUL-CUST-N02', '12, Versova Road, Andheri West, Mumbai 400061',       '+91-98201-33002', 'Mumbai North — Andheri',    hulId, hW1],
      ['Kapoor Provision House',     'HUL-CUST-N03', '7, Goregaon Market, Goregaon West, Mumbai 400062',   '+91-98201-33003', 'Mumbai North — Goregaon',   hulId, hW1],
      ['Om Sai Kirana Bhandar',      'HUL-CUST-N04', '22, Malad Market, Malad West, Mumbai 400064',        '+91-98201-33004', 'Mumbai North — Malad',      hulId, hW1],
      ['Choice Supermarket',         'HUL-CUST-N05', '5, Marve Road, Malad West, Mumbai 400064',           '+91-98201-33005', 'Mumbai North — Malad',      hulId, hW1],
      ['Balaji Traders',             'HUL-CUST-N06', '18, Kandivali Market, Kandivali West, Mumbai 400067','+91-98201-33006', 'Mumbai North — Kandivali',  hulId, hW1],
    ]);

    // ─── ITC Customers ──────────────────────────────────────────────────

    // Route 1 — Thane (West / East / Wagle Estate) — 6 stops
    const itcThaneIds = await insertCustomers([
      ['Thane Provision Depot',      'ITC-CUST-T01', '4, Naupada, Thane West 400602',                      '+91-98201-44001', 'Thane West',                itcId, iW2],
      ['Gadkari Kirana Store',       'ITC-CUST-T02', '12, Gokhale Road, Thane West 400602',                '+91-98201-44002', 'Thane West',                itcId, iW2],
      ['Patil Wholesale Grocers',    'ITC-CUST-T03', '8, Station Road, Thane East 400603',                 '+91-98201-44003', 'Thane East',                itcId, iW2],
      ['Shubham General Merchants',  'ITC-CUST-T04', '3, Vartak Nagar, Thane West 400606',                 '+91-98201-44004', 'Thane West',                itcId, iW2],
      ['Vijay Supermart',            'ITC-CUST-T05', '16, Wagle Estate, Thane West 400604',                '+91-98201-44005', 'Thane — Wagle Estate',      itcId, iW2],
      ['New Sai Provision Store',    'ITC-CUST-T06', '9, Kopri Colony, Thane East 400603',                 '+91-98201-44006', 'Thane East',                itcId, iW2],
    ]);

    // Route 2 — Navi Mumbai (Vashi / Nerul / Kharghar / Panvel) — 5 stops
    const itcNaviIds = await insertCustomers([
      ['Chembur Kirana Palace',      'ITC-CUST-NM01', '5, Sion-Trombay Road, Chembur, Mumbai 400071',     '+91-98201-55001', 'Navi Mumbai — Chembur',     itcId, iW2],
      ['Vashi Wholesale Mart',       'ITC-CUST-NM02', '14, Sector 17, Vashi, Navi Mumbai 400703',         '+91-98201-55002', 'Navi Mumbai — Vashi',       itcId, iW2],
      ['Nerul General Store',        'ITC-CUST-NM03', '7, Sector 9, Nerul, Navi Mumbai 400706',           '+91-98201-55003', 'Navi Mumbai — Nerul',       itcId, iW2],
      ['Kharghar Provision Centre',  'ITC-CUST-NM04', '3, Sector 10, Kharghar, Navi Mumbai 410210',       '+91-98201-55004', 'Navi Mumbai — Kharghar',    itcId, iW2],
      ['Panvel Trade Depot',         'ITC-CUST-NM05', '22, Old Panvel, Panvel 410206',                    '+91-98201-55005', 'Navi Mumbai — Panvel',      itcId, iW2],
    ]);

    // Route 3 — Kurla / Ghatkopar / Vikhroli — 6 stops
    const itcKurlaIds = await insertCustomers([
      ['Kurla Station Kirana',       'ITC-CUST-K01', '4, LBS Marg, Kurla West, Mumbai 400070',            '+91-98201-66001', 'Kurla Zone',                itcId, iW2],
      ['Chhatrapati Provision Store','ITC-CUST-K02', '8, Ghatkopar Market, Ghatkopar West, Mumbai 400086','+91-98201-66002', 'Kurla Zone — Ghatkopar',    itcId, iW2],
      ['Vikhroli Trading Co.',       'ITC-CUST-K03', '5, Parksite, Vikhroli West, Mumbai 400079',         '+91-98201-66003', 'Kurla Zone — Vikhroli',     itcId, iW2],
      ['Chunabhatti General Store',  'ITC-CUST-K04', '12, Sion-Kurla Road, Chunabhatti, Mumbai 400022',   '+91-98201-66004', 'Kurla Zone',                itcId, iW2],
      ['Govandi Kirana Hub',         'ITC-CUST-K05', '7, Govandi Station Road, Govandi, Mumbai 400088',   '+91-98201-66005', 'Kurla Zone — Govandi',      itcId, iW2],
      ['Mankhurd Provision Mart',    'ITC-CUST-K06', '3, Mankhurd Village Road, Mankhurd, Mumbai 400088', '+91-98201-66006', 'Kurla Zone — Mankhurd',     itcId, iW2],
    ]);

    // ─── Other Company Customers (admin panel completeness) ─────────────

    await insertCustomers([
      // Nestle (4 customers)
      ['Raj Confectionery Mart',      'NESTLE-CUST-001', '7, FC Road, Deccan Gymkhana, Pune 411004',         '+91-98201-77001', 'Pune — Deccan',              nestleId, nW4],
      ['Sagar Food Distributors',     'NESTLE-CUST-002', '14, Lokhandwala Complex, Andheri West, Mumbai 400053', '+91-98201-77002', 'Mumbai — Andheri West',  nestleId, nW1],
      ['Modern Bakery & General',     'NESTLE-CUST-003', 'B-12, Connaught Place, New Delhi 110001',           '+91-98201-77003', 'Delhi — Connaught Place',    nestleId, nW2],
      ['Fresh Corner Supermarket',    'NESTLE-CUST-004', '5, Sector 14, Gurugram 122001',                     '+91-98201-77004', 'Gurugram — Sector 14',       nestleId, nW3],

      // Britannia (4 customers)
      ['Dalmia Biscuit Traders',      'BRIT-CUST-001', '22, Brigade Road, Bengaluru 560025',                  '+91-98201-88001', 'Bengaluru — Brigade Road',   britId, bW1],
      ['National Provision Store',    'BRIT-CUST-002', '8, South Extension Part II, New Delhi 110049',         '+91-98201-88002', 'Delhi — South Extension',    britId, bW2],
      ['Laxmi Departmental Store',    'BRIT-CUST-003', '3, Rashbehari Avenue, Kolkata 700019',                '+91-98201-88003', 'Kolkata — Rashbehari Ave',   britId, bW4],
      ['Sunrise Bakery Mart',         'BRIT-CUST-004', '11, Anna Salai, Chennai 600002',                      '+91-98201-88004', 'Chennai — Anna Salai',       britId, bW3],

      // Dabur (4 customers)
      ['Ayur Health Traders',         'DABUR-CUST-001', '14, Rajouri Garden, New Delhi 110027',               '+91-98201-99001', 'Delhi — Rajouri Garden',     daburId, dW1],
      ['Wellness Pharmacy & General', 'DABUR-CUST-002', 'A-4, Sector 18, Noida 201301',                      '+91-98201-99002', 'Noida — Sector 18',          daburId, dW2],
      ['Mumbai Herbal Mart',          'DABUR-CUST-003', '9, Mahim Causeway, Mahim, Mumbai 400016',            '+91-98201-99003', 'Mumbai — Mahim',             daburId, dW3],
      ['Gujarat Ayurvedic Centre',    'DABUR-CUST-004', '17, CG Road, Navrangpura, Ahmedabad 380009',         '+91-98201-99004', 'Ahmedabad — CG Road',        daburId, dW4],

      // GCPL (4 customers)
      ['Beauty Plus Traders',         'GCPL-CUST-001', '6, Mulund West Market, Mumbai 400080',                '+91-98202-11001', 'Mumbai — Mulund',            gcplId, gW1],
      ['Smart Grocer',                'GCPL-CUST-002', '23, Sector 56, Gurugram 122011',                      '+91-98202-11002', 'Gurugram — Sector 56',       gcplId, gW2],
      ['Green Leaf Supermarket',      'GCPL-CUST-003', 'No. 4, Jayanagar 4th Block, Bengaluru 560011',        '+91-98202-11003', 'Bengaluru — Jayanagar',      gcplId, gW3],
      ['Tamil Provision House',       'GCPL-CUST-004', '8, T. Nagar, Chennai 600017',                        '+91-98202-11004', 'Chennai — T. Nagar',         gcplId, gW4],

      // Marico (4 customers)
      ['Sunrise Hair Mart',           'MARICO-CUST-001', '12, Santacruz East, Mumbai 400055',                 '+91-98202-22001', 'Mumbai — Santacruz East',    maricoId, mW1],
      ['Omega General Traders',       'MARICO-CUST-002', '5, Karol Bagh, New Delhi 110005',                   '+91-98202-22002', 'Delhi — Karol Bagh',         maricoId, mW2],
      ['Eastern Provision Depot',     'MARICO-CUST-003', '7, Salt Lake Sector V, Kolkata 700091',             '+91-98202-22003', 'Kolkata — Salt Lake',        maricoId, mW3],
      ['Navratna Traders',            'MARICO-CUST-004', '19, Maninagar, Ahmedabad 380008',                   '+91-98202-22004', 'Ahmedabad — Maninagar',      maricoId, mW4],
    ]);

    // ─── Routes ─────────────────────────────────────────────────────────
    const insertRoute = (id, name, code, compId, whId, vehId, empId) =>
      run(
        `INSERT INTO routes
         (id, route_name, route_code, valid_from, valid_to, status,
          company_id, warehouse_id, vehicle_id, role, primary_employee_id, frequency, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, code, today, nextYear, 'active', compId, whId, vehId, 'van_sales_user', empId, 'daily', adminId],
      );

    // vansales_test01: 3 HUL routes
    const hulRtWest = uuidv4(), hulRtCentral = uuidv4(), hulRtNorth = uuidv4();
    await insertRoute(hulRtWest,    'HUL Mumbai West Morning Route', 'HUL-RT-W01',  hulId, hW1, hulV1, sales1Id);
    await insertRoute(hulRtCentral, 'HUL Mumbai Central Route',      'HUL-RT-C01',  hulId, hW1, hulV2, sales1Id);
    await insertRoute(hulRtNorth,   'HUL Mumbai North Route',        'HUL-RT-N01',  hulId, hW1, hulV3, sales1Id);

    // vansales_test02: 3 ITC routes
    const itcRtThane = uuidv4(), itcRtNavi = uuidv4(), itcRtKurla = uuidv4();
    await insertRoute(itcRtThane,   'ITC Mumbai Thane Zone Route',   'ITC-RT-T01',  itcId, iW2, itcV1, sales2Id);
    await insertRoute(itcRtNavi,    'ITC Mumbai Navi Mumbai Route',  'ITC-RT-NM01', itcId, iW2, itcV2, sales2Id);
    await insertRoute(itcRtKurla,   'ITC Mumbai Kurla Zone Route',   'ITC-RT-K01',  itcId, iW2, itcV3, sales2Id);

    // ─── Route Customers ────────────────────────────────────────────────
    const addRouteCustomers = async (routeId, custIds, startHour = 9) => {
      for (let i = 0; i < custIds.length; i++) {
        await run(
          `INSERT INTO route_customers
           (id, route_id, customer_id, duration, scheduled_time, priority, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), routeId, custIds[i], 30, `${String(startHour + i).padStart(2, '0')}:00`, 'high', i + 1],
        );
      }
    };

    await addRouteCustomers(hulRtWest,    hulWestIds,    9);
    await addRouteCustomers(hulRtCentral, hulCentralIds, 9);
    await addRouteCustomers(hulRtNorth,   hulNorthIds,   9);
    await addRouteCustomers(itcRtThane,   itcThaneIds,   9);
    await addRouteCustomers(itcRtNavi,    itcNaviIds,    9);
    await addRouteCustomers(itcRtKurla,   itcKurlaIds,   9);

    // ─── Journey Plans — today ───────────────────────────────────────────
    const jp1 = uuidv4(), jp2 = uuidv4();

    await run(
      'INSERT INTO journey_plans (id, plan_name, route_id, assigned_to, date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [jp1, `HUL Mumbai West Morning Plan - ${today}`, hulRtWest,  sales1Id, today, 'active', adminId],
    );
    await run(
      'INSERT INTO journey_plans (id, plan_name, route_id, assigned_to, date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [jp2, `ITC Mumbai Thane Zone Plan - ${today}`,   itcRtThane, sales2Id, today, 'active', adminId],
    );

    // ─── Visits ─────────────────────────────────────────────────────────
    for (const custId of hulWestIds) {
      await run(
        'INSERT INTO visits (id, journey_plan_id, customer_id, van_sales_user_id, status) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), jp1, custId, sales1Id, 'pending'],
      );
    }
    for (const custId of itcThaneIds) {
      await run(
        'INSERT INTO visits (id, journey_plan_id, customer_id, van_sales_user_id, status) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), jp2, custId, sales2Id, 'pending'],
      );
    }

    await exec('COMMIT');

    console.log('\nSeed complete.\n');
    console.log('-- Credentials ------------------------------------------');
    console.log('  admin_test      / Admin@123  (admin)');
    console.log('  vansales_test01 / Sales@123  -> HUL Mumbai West — 7 stops today');
    console.log('  vansales_test02 / Sales@123  -> ITC Thane Zone  — 6 stops today');
    console.log('---------------------------------------------------------\n');
    console.log('Companies : 7   (HUL, ITC, Nestle, Britannia, Dabur, GCPL, Marico)');
    console.log('Warehouses: 32  (4-6 per company)');
    console.log('Customers : 59  (19 HUL + 17 ITC + 4 each other)');
    console.log('Routes    : 6   (3 per sales user)');
    console.log('Plans     : 2   (1 per sales user, dated today)');
    console.log('Visits    : 13  (7 for test01, 6 for test02)\n');

  } catch (err) {
    await exec('ROLLBACK');
    throw err;
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
});
