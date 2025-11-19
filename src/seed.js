// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   // ✅ 1. Seed roles
//   const roles = [
//     { role_id: 1, name: "superadmin" },
//     { role_id: 2, name: "admin" },
//     { role_id: 3, name: "coordinator" },
//     { role_id: 4, name: "accountant" },
//     { role_id: 5, name: "teacher" },
//     { role_id: 6, name: "student" },
//   ];

//   for (const role of roles) {
//     await prisma.role.upsert({
//       where: { role_id: role.role_id },
//       update: {},
//       create: role,
//     });
//   }

//   console.log("✅ Roles seeded successfully!");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seeding failed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });


// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   console.log("Seeding database...");

//   // --- 1. Provinces ---
//   const provincesData = [
//     { name: "Province 1", code: "P1" },
//     { name: "Province 2", code: "P2" },
//     { name: "Bagmati Province", code: "BP" },
//     { name: "Gandaki Province", code: "GP" },
//     { name: "Lumbini Province", code: "LP" },
//   ];

//   const provinces = [];

//   for (const province of provincesData) {
//     const createdProvince = await prisma.provinces.create({
//       data: province,
//     });
//     provinces.push(createdProvince);
//   }

//   // --- 2. Districts ---
//   const districtsData = [
//     { name: "Bhaktapur", provinceName: "Bagmati Province", postal_code: "1000" },
//     { name: "Kathmandu", provinceName: "Bagmati Province", postal_code: "44600" },
//     { name: "Lalitpur", provinceName: "Bagmati Province", postal_code: "44700" },
//   ];

//   const districts = [];

//   for (const district of districtsData) {
//     const province = provinces.find(p => p.name === district.provinceName);
//     if (!province) throw new Error(`Province ${district.provinceName} not found`);
//     const createdDistrict = await prisma.districts.create({
//       data: {
//         name: district.name,
//         province_id: province.id,
//         postal_code: district.postal_code || null,
//       },
//     });
//     districts.push(createdDistrict);
//   }

//   // --- 3. Cities ---
//   const citiesData = [
//     { name: "Bhaktapur City", districtName: "Bhaktapur" },
//     { name: "Kathmandu City", districtName: "Kathmandu" },
//     { name: "Lalitpur City", districtName: "Lalitpur" },
//   ];

//   const cities = [];

//   for (const city of citiesData) {
//     const district = districts.find(d => d.name === city.districtName);
//     if (!district) throw new Error(`District ${city.districtName} not found`);
//     const createdCity = await prisma.cities.create({
//       data: {
//         name: city.name,
//         district_id: district.id,
//       },
//     });
//     cities.push(createdCity);
//   }

//   // --- 4. Areas ---
//   const areasData = [
//     { name: "Suryabinayak", cityName: "Bhaktapur City" },
//     { name: "Madhyapur", cityName: "Bhaktapur City" },
//     { name: "Thamel", cityName: "Kathmandu City" },
//     { name: "Patan", cityName: "Lalitpur City" },
//   ];

//   for (const area of areasData) {
//     const city = cities.find(c => c.name === area.cityName);
//     if (!city) throw new Error(`City ${area.cityName} not found`);
//     await prisma.areas.create({
//       data: {
//         name: area.name,
//         city_id: city.id,
//       },
//     });
//   }

//   console.log("Seeding completed successfully ✅");
// }

// main()
//   .catch((e) => {
//     console.error("Seeding failed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });




// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   // Fixed material types to seed
//   const materialTypes = [
//     { type_name: "Notes", description: "Text-based lecture notes" },
//     { type_name: "Assignment", description: "Homework or practice tasks" },
//     { type_name: "Video", description: "Lecture or tutorial recordings" },
//     { type_name: "Presentation", description: "Slide or class presentations" },
//     { type_name: "Quiz", description: "Assessment or self-test materials" },
//     { type_name: "Other", description: "Miscellaneous study materials" },
//   ];

//   console.log("⏳ Seeding material types...");

//   for (const type of materialTypes) {
//     await prisma.materialtype.upsert({
//       where: { type_name: type.type_name },
//       update: {}, // no update, just ensure it exists
//       create: type,
//     });
//   }

//   console.log("✅ Material types seeded successfully!");
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error("❌ Error seeding material types:", e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });


// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   // 1️⃣ Seed provinces (Nepal has 7 provinces)
//   const provinces = [
//     { name: "Koshi", code: "NP-P1" },
//     { name: "Madhesh", code: "NP-P2" },
//     { name: "Bagmati", code: "NP-P3" },
//     { name: "Gandaki", code: "NP-P4" },
//     { name: "Lumbini", code: "NP-P5" },
//     { name: "Karnali", code: "NP-P6" },
//     { name: "Sudurpashchim", code: "NP-P7" },
//   ];

//   console.log("⏳ Seeding provinces...");
//    await prisma.provinces.createMany({
//     data: provinces,
//     skipDuplicates: true,
//   });
//   const provinceRecords = await prisma.provinces.findMany();
//   console.log("✅ Provinces seeded successfully!");

//   // 2️⃣ Seed districts (77 districts)
//   // Format: { name, provinceName, postal_code }
//   // You can expand with all 77 districts, here are examples
//   const districts = [
//     // Koshi
//     { name: "Taplejung", provinceName: "Koshi", postal_code: "57500" },
//     { name: "Panchthar", provinceName: "Koshi", postal_code: "57600" },
//     { name: "Ilam", provinceName: "Koshi", postal_code: "57700" },
//     { name: "Jhapa", provinceName: "Koshi", postal_code: "57800" },
//     { name: "Tehrathum", provinceName: "Koshi", postal_code: "57900" },
//     { name: "Sankhuwasabha", provinceName: "Koshi", postal_code: "58000" },
//     { name: "Dhankuta", provinceName: "Koshi", postal_code: "58100" },
//     { name: "Morang", provinceName: "Koshi", postal_code: "58200" },
//     { name: "Sunsari", provinceName: "Koshi", postal_code: "58300" },
//     { name: "Bhojpur", provinceName: "Koshi", postal_code: "58400" },
//     { name: "Udayapur", provinceName: "Koshi", postal_code: "58500" },
//     { name: "Khotang", provinceName: "Koshi", postal_code: "58600" },
//     { name: "Solukhumbu", provinceName: "Koshi", postal_code: "58700" },
//     { name: "Okhaldhunga", provinceName: "Koshi", postal_code: "58800" },

//     // Madhesh
//     { name: "Saptari", provinceName: "Madhesh", postal_code: "56400" },
//     { name: "Siraha", provinceName: "Madhesh", postal_code: "56500" },
//     { name: "Dhanusha", provinceName: "Madhesh", postal_code: "56600" },
//     { name: "Mahottari", provinceName: "Madhesh", postal_code: "56700" },
//     { name: "Sarlahi", provinceName: "Madhesh", postal_code: "56800" },
//     { name: "Rautahat", provinceName: "Madhesh", postal_code: "56900" },
//     { name: "Bara", provinceName: "Madhesh", postal_code: "57000" },
//     { name: "Parsa", provinceName: "Madhesh", postal_code: "57100" },

//     // Bagmati
//     { name: "Dolakha", provinceName: "Bagmati", postal_code: "45300" },
//     { name: "Ramechhap", provinceName: "Bagmati", postal_code: "45310" },
//     { name: "Sindhuli", provinceName: "Bagmati", postal_code: "45320" },
//     { name: "Sindhupalchowk", provinceName: "Bagmati", postal_code: "45330" },
//     { name: "Kavrepalanchok", provinceName: "Bagmati", postal_code: "45340" },
//     { name: "Kathmandu", provinceName: "Bagmati", postal_code: "44600" },
//     { name: "Lalitpur", provinceName: "Bagmati", postal_code: "44700" },
//     { name: "Bhaktapur", provinceName: "Bagmati", postal_code: "44800" },
//     { name: "Rasuwa", provinceName: "Bagmati", postal_code: "45000" },
//     { name: "Nuwakot", provinceName: "Bagmati", postal_code: "45200" },
//     { name: "Makawanpur", provinceName: "Bagmati", postal_code: "45350" },
//     { name: "Dhading", provinceName: "Bagmati", postal_code: "45360" },
//     { name: "Chitwan", provinceName: "Bagmati", postal_code: "44200" },

//     // Gandaki
//     { name: "Baglung", provinceName: "Gandaki", postal_code: "33300" },
//     { name: "Gorkha", provinceName: "Gandaki", postal_code: "34000" },
//     { name: "Kaski", provinceName: "Gandaki", postal_code: "33700" },
//     { name: "Lamjung", provinceName: "Gandaki", postal_code: "33600" },
//     { name: "Manang", provinceName: "Gandaki", postal_code: "33500" },
//     { name: "Mustang", provinceName: "Gandaki", postal_code: "33400" },
//     { name: "Myagdi", provinceName: "Gandaki", postal_code: "33200" },
//     { name: "Nawalpur", provinceName: "Gandaki", postal_code: "33100" },
//     { name: "Parbat", provinceName: "Gandaki", postal_code: "33800" },
//     { name: "Syangja", provinceName: "Gandaki", postal_code: "33900" },
//     { name: "Tanahun", provinceName: "Gandaki", postal_code: "34100" },

//     // Lumbini
//     { name: "Arghakhanchi", provinceName: "Lumbini", postal_code: "32700" },
//     { name: "Banke", provinceName: "Lumbini", postal_code: "21900" },
//     { name: "Bardiya", provinceName: "Lumbini", postal_code: "22000" },
//     { name: "Dang", provinceName: "Lumbini", postal_code: "22200" },
//     { name: "Gulmi", provinceName: "Lumbini", postal_code: "32500" },
//     { name: "Kapilvastu", provinceName: "Lumbini", postal_code: "32900" },
//     { name: "Kailali", provinceName: "Lumbini", postal_code: "10700" },
//     { name: "Palpa", provinceName: "Lumbini", postal_code: "32400" },
//     { name: "Pyuthan", provinceName: "Lumbini", postal_code: "32300" },
//     { name: "Rupandehi", provinceName: "Lumbini", postal_code: "32900" },
//     { name: "Rolpa", provinceName: "Lumbini", postal_code: "22300" },
//     { name: "Rukum West", provinceName: "Lumbini", postal_code: "22000" },

//     // Karnali
//     { name: "Bajhang", provinceName: "Karnali", postal_code: "10400" },
//     { name: "Bajura", provinceName: "Karnali", postal_code: "10500" },
//     { name: "Dailekh", provinceName: "Karnali", postal_code: "21600" },
//     { name: "Dolpa", provinceName: "Karnali", postal_code: "21400" },
//     { name: "Humla", provinceName: "Karnali", postal_code: "21000" },
//     { name: "Jajarkot", provinceName: "Karnali", postal_code: "21500" },
//     { name: "Jumla", provinceName: "Karnali", postal_code: "21200" },
//     { name: "Kalikot", provinceName: "Karnali", postal_code: "21300" },
//     { name: "Mugu", provinceName: "Karnali", postal_code: "21100" },
//     { name: "Salyan", provinceName: "Karnali", postal_code: "22200" },
//     { name: "Surkhet", provinceName: "Karnali", postal_code: "21700" },

//     // Sudurpashchim
//     { name: "Achham", provinceName: "Sudurpashchim", postal_code: "10700" },
//     { name: "Baitadi", provinceName: "Sudurpashchim", postal_code: "10600" },
//     { name: "Bajura", provinceName: "Sudurpashchim", postal_code: "10500" },
//     { name: "Dadeldhura", provinceName: "Sudurpashchim", postal_code: "10400" },
//     { name: "Darchula", provinceName: "Sudurpashchim", postal_code: "10300" },
//     { name: "Doti", provinceName: "Sudurpashchim", postal_code: "10200" },
//     { name: "Kailali", provinceName: "Sudurpashchim", postal_code: "10700" },
//     { name: "Kanchanpur", provinceName: "Sudurpashchim", postal_code: "10800" },
//   ];

//   console.log("⏳ Seeding districts...");
//  const districtData = districts.map((d) => {
//     const province = provinceRecords.find((p) => p.name === d.provinceName);
//     if (!province) return null;
//     return {
//       name: d.name,
//       postal_code: d.postal_code || null,
//       province_id: province.id,
//     };
//   }).filter(Boolean);

//   await prisma.districts.createMany({
//     data: districtData,
//     skipDuplicates: true,
//   });
//   const districtRecords = await prisma.districts.findMany();
//   console.log("✅ Districts seeded successfully!");


//   // 3️⃣ Seed major cities
//   // Format: { name, districtName }
//   const cities = [
//      { name: "Kathmandu", districtName: "Kathmandu" },
//   { name: "Lalitpur", districtName: "Lalitpur" },
//   { name: "Bhaktapur", districtName: "Bhaktapur" },
//   { name: "Pokhara", districtName: "Kaski" },
//   { name: "Biratnagar", districtName: "Morang" },
//   { name: "Dharan", districtName: "Sunsari" },
//   { name: "Birgunj", districtName: "Parsa" },
//   { name: "Hetauda", districtName: "Makwanpur" },
//   { name: "Janakpur", districtName: "Dhanusha" },
//   { name: "Bharatpur", districtName: "Chitwan" },
//   { name: "Butwal", districtName: "Rupandehi" },
//   { name: "Nepalgunj", districtName: "Banke" },
//   { name: "Dhangadhi", districtName: "Kailali" },
//   { name: "Mahendranagar", districtName: "Kanchanpur" },
//   { name: "Itahari", districtName: "Sunsari" },
//   { name: "Gorkha", districtName: "Gorkha" },
//   { name: "Janakpur Dham", districtName: "Dhanusha" },
//   { name: "Damak", districtName: "Jhapa" },
//   { name: "Tulsipur", districtName: "Dang" },
//   { name: "Rajbiraj", districtName: "Saptari" },
//   ];

//   console.log("⏳ Seeding cities...");
//  const cityData = cities.map((c) => {
//     const district = districtRecords.find((d) => d.name === c.districtName);
//     if (!district) return null;
//     return {
//       name: c.name,
//       district_id: district.id,
//     };
//   }).filter(Boolean);

//   await prisma.cities.createMany({
//     data: cityData,
//     skipDuplicates: true,
//   });
//   const cityRecords = await prisma.cities.findMany();
//   console.log("✅ Cities seeded successfully!");
//   // 4️⃣ Seed areas/localities
//   // Format: { name, cityName }
//   const areas = [
//     // Kathmandu
//   { name: "Thamel", cityName: "Kathmandu" },
//   { name: "New Baneshwor", cityName: "Kathmandu" },
//   { name: "Putalisadak", cityName: "Kathmandu" },
//   { name: "Koteshwor", cityName: "Kathmandu" },
//   { name: "Durbarmarg", cityName: "Kathmandu" },

//   // Lalitpur
//   { name: "Jawlakhel", cityName: "Lalitpur" },
//   { name: "Patan Bazaar", cityName: "Lalitpur" },
//   { name: "Pulchowk", cityName: "Lalitpur" },
//   { name: "Lalitpur Patan", cityName: "Lalitpur" },

//   // Bhaktapur
//   { name: "Taumadhi", cityName: "Bhaktapur" },
//   { name: "Suryabinayak", cityName: "Bhaktapur" },
//   { name: "Dattatreya", cityName: "Bhaktapur" },

//   // Pokhara
//   { name: "Mahendrapool", cityName: "Pokhara" },
//   { name: "Lakeside", cityName: "Pokhara" },
//   { name: "Prithivi Chowk", cityName: "Pokhara" },

//   // Biratnagar
//   { name: "Biratnagar Bazaar", cityName: "Biratnagar" },
//   { name: "Bharat Bazaar", cityName: "Biratnagar" },
//   { name: "Itahari Road", cityName: "Biratnagar" },

//   // Dharan
//   { name: "Dharan Bazaar", cityName: "Dharan" },
//   { name: "Mangalbare", cityName: "Dharan" },

//   // Butwal
//   { name: "Sundhara", cityName: "Butwal" },
//   { name: "Naya Bazaar", cityName: "Butwal" },

//   // Nepalgunj
//   { name: "Tulsipur Road", cityName: "Nepalgunj" },
//   { name: "Rara Road", cityName: "Nepalgunj" },

//   // Dhangadhi
//   { name: "Kailali Bazaar", cityName: "Dhangadhi" },
//   { name: "Mahendranagar Road", cityName: "Dhangadhi" },

//   // Additional examples
//   { name: "Janakpur Bazaar", cityName: "Janakpur" },
//   { name: "Hetauda Chowk", cityName: "Hetauda" },
//   { name: "Bharatpur Chowk", cityName: "Bharatpur" },
//   ];

//   console.log("⏳ Seeding areas...");
// const areaData = areas.map((a) => {
//     const city = cityRecords.find((c) => c.name === a.cityName);
//     if (!city) return null;
//     return {
//       name: a.name,
//       city_id: city.id,
//     };
//   }).filter(Boolean);

//   await prisma.areas.createMany({
//     data: areaData,
//     skipDuplicates: true,
//   });
//   console.log("✅ Areas seeded successfully!");
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//     console.log("🌱 Seeding finished!");
//   })
//   .catch(async (e) => {
//     console.error("❌ Error seeding locations:", e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });


// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {

//   // ===== Seed Result Statuses =====
//   const resultStatuses = ["Pass", "Fail", "Absent", "Incomplete"];
//   for (const status of resultStatuses) {
//     await prisma.result_status.upsert({
//       where: { status_name: status },
//       update: {},
//       create: { status_name: status },
//     });
//   }

//   console.log("Seeding completed!");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   // 1️⃣ Create an admin user
//   const adminUser = await prisma.user.upsert({
//     where: { email: "ayinos.apaht143@gmail.com" },
//      update: {
//     // Optional: you can update any field here if user exists
//     full_name: "Soniya Thapa",
//     gender: "female",
//     updated_at: new Date(),
//   },
//   create: {
//     username: "Sonia_" + Date.now(), // make it unique if necessary
//     email: "ayinos.apaht143@gmail.com",
//     password: "asdfghjkl",
//     full_name: "Soniya Thapa",
//     gender: "female",
//     updated_at: new Date(),
//   },
//   });

//   // 2️⃣ Seed Fee Categories with admin as creator
//   const feeCategories = ["Tuition", "Library", "Lab", "Examination", "Other"];
//   for (const category of feeCategories) {
//     await prisma.fee_category.upsert({
//       where: { category_name: category },
//       update: {},
//       create: {
//         category_name: category,
//         created_by: adminUser.user_id, // important!
//       },
//     });
//   }

//   console.log("Fee categories seeded successfully!");
// }

// main()
//   .catch((e) => console.error(e))
//   .finally(async () => await prisma.$disconnect());

// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
// async function main() {
//   const statuses = [
//     { name: "Pending", description: "Enrollment pending approval" },
//     { name: "Approved", description: "Enrollment has been approved" },
//     { name: "Rejected", description: "Enrollment has been rejected" },
//   ];
//   for (const status of statuses) {
//     await prisma.enrollmentstatus.upsert({
//       where: { name: status.name },
//       update: {},
//       create: status,
//     });
//   }
//   console.log("✅ Enrollment statuses seeded successfully.");
// }
// main()
//   .catch((e) => console.error(e))
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
