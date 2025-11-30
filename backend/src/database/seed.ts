import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const TEST_USERS = [
  {
    email: 'anna@test.ru',
    firstName: 'Анна',
    lastName: 'Петрова',
    gender: 'female',
    birthDate: '1998-05-15',
    cityId: 1, // Москва
    bio: 'Люблю путешествовать, фотографировать и открывать новые места. Ищу интересного собеседника.',
    vkLink: '@anna_petrova',
  },
  {
    email: 'elena@test.ru',
    firstName: 'Елена',
    lastName: 'Смирнова',
    gender: 'female',
    birthDate: '1995-08-22',
    cityId: 2, // Санкт-Петербург
    bio: 'Работаю дизайнером, увлекаюсь искусством и музыкой. Ценю честность и чувство юмора.',
    vkLink: '@elena_sm',
  },
  {
    email: 'olga@test.ru',
    firstName: 'Ольга',
    lastName: 'Козлова',
    gender: 'female',
    birthDate: '2000-03-10',
    cityId: 1,
    bio: 'Студентка, изучаю психологию. Люблю читать книги и гулять в парках.',
  },
  {
    email: 'dmitry@test.ru',
    firstName: 'Дмитрий',
    lastName: 'Иванов',
    gender: 'male',
    birthDate: '1996-11-28',
    cityId: 1,
    bio: 'Программист, люблю спорт и активный отдых. Ищу девушку для серьезных отношений.',
    maxLink: 'https://max.me/dmitry_iv',
  },
  {
    email: 'alexey@test.ru',
    firstName: 'Алексей',
    lastName: 'Соколов',
    gender: 'male',
    birthDate: '1993-07-05',
    cityId: 2,
    bio: 'Предприниматель, люблю путешествия и хорошую кухню. Открыт к новым знакомствам.',
    vkLink: '@alexey_sokolov',
  },
  {
    email: 'mikhail@test.ru',
    firstName: 'Михаил',
    lastName: 'Новиков',
    gender: 'male',
    birthDate: '1999-01-20',
    cityId: 1,
    bio: 'Музыкант, играю на гитаре. Ищу творческую и понимающую девушку.',
  },
  {
    email: 'natalia@test.ru',
    firstName: 'Наталья',
    lastName: 'Морозова',
    gender: 'female',
    birthDate: '1997-12-03',
    cityId: 3, // Новосибирск
    bio: 'Врач, люблю свою работу. В свободное время занимаюсь йогой и готовлю.',
  },
  {
    email: 'sergey@test.ru',
    firstName: 'Сергей',
    lastName: 'Волков',
    gender: 'male',
    birthDate: '1994-09-17',
    cityId: 4, // Екатеринбург
    bio: 'Инженер, увлекаюсь туризмом и фотографией. Ищу добрую и отзывчивую девушку.',
  },
];

// Тестовые аккаунты персонажей из мультфильмов
const CARTOON_USERS = [
  {
    email: 'elsa@arendelle.ru',
    firstName: 'Эльза',
    lastName: 'Аренделл',
    gender: 'female',
    birthDate: '1996-12-21',
    cityId: 2, // Санкт-Петербург (холодный город!)
    bio: '❄️ Королева Эренделла. Люблю зиму, снег и магию льда. Ищу того, кто не боится холода и готов покорять ледяные вершины вместе.',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/2/22/Elsa_Frozen_2.png',
  },
  {
    email: 'rapunzel@corona.ru',
    firstName: 'Рапунцель',
    lastName: 'Корона',
    gender: 'female',
    birthDate: '1999-05-12',
    cityId: 1, // Москва
    bio: '🌸 Принцесса с очень длинными волосами! Обожаю рисовать, петь и мечтать о приключениях. Ищу своего Флина Райдера!',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/5/55/Profile_-_Rapunzel.png',
  },
  {
    email: 'shrek@swamp.ru',
    firstName: 'Шрек',
    lastName: 'Болотный',
    gender: 'male',
    birthDate: '1990-04-22',
    cityId: 3, // Новосибирск
    bio: '🧅 Огры как луковицы - у нас много слоёв! Живу на болоте, люблю тишину и покой. Ищу ту единственную, которая полюбит меня таким, какой я есть.',
    photoUrl: 'https://static.wikia.nocookie.net/shrek/images/9/95/Shrek.png',
  },
  {
    email: 'fiona@far-far-away.ru',
    firstName: 'Фиона',
    lastName: 'Принцесса',
    gender: 'female',
    birthDate: '1992-06-18',
    cityId: 3, // Новосибирск
    bio: '👑 Принцесса днём, огресса ночью. Люблю карате и романтические закаты на болоте. Не жду принца на белом коне!',
    photoUrl: 'https://static.wikia.nocookie.net/shrek/images/4/4c/Princess_Fiona.png',
  },
  {
    email: 'woody@andys.ru',
    firstName: 'Вуди',
    lastName: 'Шериф',
    gender: 'male',
    birthDate: '1995-11-22',
    cityId: 1, // Москва
    bio: '🤠 Ты мой лучший друг! Шериф по призванию, верный товарищ по жизни. Всегда готов прийти на помощь. Ищу верную спутницу!',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/a/a9/Profile_-_Woody.png',
  },
  {
    email: 'buzz@starcommand.ru',
    firstName: 'Базз',
    lastName: 'Лайтер',
    gender: 'male',
    birthDate: '1995-06-16',
    cityId: 4, // Екатеринбург
    bio: '🚀 Бесконечность - не предел! Космический рейнджер в поиске приключений. Готов лететь к звёздам вместе с тобой!',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/d/d6/Profile_-_Buzz_Lightyear.png',
  },
  {
    email: 'moana@motunui.ru',
    firstName: 'Моана',
    lastName: 'Ваиалики',
    gender: 'female',
    birthDate: '2000-03-07',
    cityId: 2, // Санкт-Петербург
    bio: '🌊 Океан зовёт меня! Будущая вождь острова Мотунуи. Люблю море, путешествия и открывать новые горизонты.',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/8/89/Profile_-_Moana_Waialiki.png',
  },
  {
    email: 'simba@pridelands.ru',
    firstName: 'Симба',
    lastName: 'Прайдленд',
    gender: 'male',
    birthDate: '1994-06-15',
    cityId: 1, // Москва
    bio: '🦁 Хакуна Матата! Король Прайда. Прошёл долгий путь, чтобы стать тем, кем должен быть. Ищу свою Налу!',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/d/d6/Profile_-_Simba.png',
  },
  {
    email: 'ariel@atlantica.ru',
    firstName: 'Ариэль',
    lastName: 'Атлантика',
    gender: 'female',
    birthDate: '1998-11-17',
    cityId: 2, // Санкт-Петербург
    bio: '🧜‍♀️ Я хочу быть там, где люди! Русалочка-мечтательница. Коллекционирую интересные вещи и мечтаю о приключениях на суше.',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/c/c4/Profile_-_Ariel.png',
  },
  {
    email: 'aladdin@agrabah.ru',
    firstName: 'Аладдин',
    lastName: 'Агрибах',
    gender: 'male',
    birthDate: '1997-05-25',
    cityId: 4, // Екатеринбург
    bio: '🧞 Алмаз неогранённый! Бывший уличный воришка, теперь принц. У меня есть ковёр-самолёт и лучший друг Джинн!',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/a/ae/Profile_-_Aladdin.png',
  },
  {
    email: 'belle@villeneu.ru',
    firstName: 'Белль',
    lastName: 'Виллнёв',
    gender: 'female',
    birthDate: '1997-09-22',
    cityId: 1, // Москва
    bio: '📚 Хочу приключений больше, чем могу описать! Обожаю книги, умных собеседников и не боюсь чудовищ. Ищу того, кто ценит внутреннюю красоту.',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/0/05/Profile_-_Belle.png',
  },
  {
    email: 'mike@monstersinc.ru',
    firstName: 'Майк',
    lastName: 'Вазовски',
    gender: 'male',
    birthDate: '1993-09-01',
    cityId: 3, // Новосибирск
    bio: '👁️ Я на обложке журнала! Работаю на фабрике смеха, обожаю веселить людей. Мой лучший друг - Салли. Ищу ту, которая оценит моё чувство юмора!',
    photoUrl: 'https://static.wikia.nocookie.net/disney/images/c/cd/Profile_-_Mike_Wazowski.png',
  },
];

// Placeholder image colors for generating simple avatars
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

// Cartoon character colors for SVG placeholders
const CARTOON_COLORS: { [key: string]: { bg: string; text: string } } = {
  'Эльза': { bg: '#87CEEB', text: '❄️' },
  'Рапунцель': { bg: '#DDA0DD', text: '🌸' },
  'Шрек': { bg: '#7CB342', text: '🧅' },
  'Фиона': { bg: '#66BB6A', text: '👑' },
  'Вуди': { bg: '#8D6E63', text: '🤠' },
  'Базз': { bg: '#5C6BC0', text: '🚀' },
  'Моана': { bg: '#26C6DA', text: '🌊' },
  'Симба': { bg: '#FFB74D', text: '🦁' },
  'Ариэль': { bg: '#4DD0E1', text: '🧜' },
  'Аладдин': { bg: '#7E57C2', text: '🧞' },
  'Белль': { bg: '#FFCA28', text: '📚' },
  'Майк': { bg: '#81C784', text: '👁️' },
};

async function createPlaceholderImage(name: string, color: string, filename: string): Promise<void> {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create a simple SVG placeholder and save as file
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <rect width="400" height="500" fill="${color}"/>
    <text x="200" y="270" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
  </svg>`;

  // Save SVG directly (we'll treat it as an image)
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, svg);
}

async function createCartoonPlaceholder(firstName: string, filename: string): Promise<void> {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const colors = CARTOON_COLORS[firstName] || { bg: '#9C27B0', text: '✨' };
  
  // Create a fancy SVG with cartoon character emoji and name
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${adjustColor(colors.bg, -30)};stop-opacity:1" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect width="400" height="500" fill="url(#grad)"/>
    <circle cx="200" cy="180" r="100" fill="white" opacity="0.2"/>
    <text x="200" y="210" font-family="Arial, sans-serif" font-size="100" text-anchor="middle" filter="url(#shadow)">${colors.text}</text>
    <text x="200" y="350" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow)">${firstName}</text>
    <text x="200" y="400" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" opacity="0.8">Тестовый аккаунт</text>
  </svg>`;

  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, svg);
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

async function seed() {
  console.log('Starting seed...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const hashedPassword = await bcrypt.hash('Тест1пароль', 12);

  // Seed regular test users
  console.log('\n📝 Creating regular test users...');
  for (let i = 0; i < TEST_USERS.length; i++) {
    const userData = TEST_USERS[i];
    
    // Check if user already exists
    const existingUser = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.length > 0) {
      console.log(`User ${userData.email} already exists, skipping...`);
      continue;
    }

    const userId = uuidv4();
    const profileId = uuidv4();
    const photoId = uuidv4();
    const photoFilename = `${uuidv4()}.svg`;

    // Create placeholder image
    const color = COLORS[i % COLORS.length];
    await createPlaceholderImage(
      `${userData.firstName} ${userData.lastName}`,
      color,
      photoFilename
    );

    // Insert user
    await dataSource.query(
      `INSERT INTO users (id, email, password, "emailConfirmed", "isActive") 
       VALUES ($1, $2, $3, true, true)`,
      [userId, userData.email, hashedPassword]
    );

    // Insert profile
    await dataSource.query(
      `INSERT INTO profiles (id, "firstName", "lastName", "birthDate", gender, "cityId", bio, "vkLink", "maxLink", "userId", "isVisible")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [
        profileId,
        userData.firstName,
        userData.lastName,
        userData.birthDate,
        userData.gender,
        userData.cityId,
        userData.bio || null,
        userData.vkLink || null,
        userData.maxLink || null,
        userId
      ]
    );

    // Insert photo
    await dataSource.query(
      `INSERT INTO photos (id, filename, "originalName", "mimeType", size, "isMain", "order", "profileId")
       VALUES ($1, $2, $3, $4, $5, true, 0, $6)`,
      [photoId, photoFilename, 'avatar.svg', 'image/svg+xml', 1024, profileId]
    );

    console.log(`Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
  }

  // Seed cartoon character users
  console.log('\n🎬 Creating cartoon character test users...');
  for (let i = 0; i < CARTOON_USERS.length; i++) {
    const userData = CARTOON_USERS[i];
    
    // Check if user already exists
    const existingUser = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.length > 0) {
      console.log(`User ${userData.email} already exists, skipping...`);
      continue;
    }

    const userId = uuidv4();
    const profileId = uuidv4();
    const photoId = uuidv4();
    const photoFilename = `${uuidv4()}.svg`;

    // Create cartoon character placeholder image
    await createCartoonPlaceholder(userData.firstName, photoFilename);

    // Insert user
    await dataSource.query(
      `INSERT INTO users (id, email, password, "emailConfirmed", "isActive") 
       VALUES ($1, $2, $3, true, true)`,
      [userId, userData.email, hashedPassword]
    );

    // Insert profile
    await dataSource.query(
      `INSERT INTO profiles (id, "firstName", "lastName", "birthDate", gender, "cityId", bio, "vkLink", "maxLink", "userId", "isVisible")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [
        profileId,
        userData.firstName,
        userData.lastName,
        userData.birthDate,
        userData.gender,
        userData.cityId,
        userData.bio || null,
        null, // vkLink
        null, // maxLink
        userId
      ]
    );

    // Insert photo
    await dataSource.query(
      `INSERT INTO photos (id, filename, "originalName", "mimeType", size, "isMain", "order", "profileId")
       VALUES ($1, $2, $3, $4, $5, true, 0, $6)`,
      [photoId, photoFilename, 'avatar.svg', 'image/svg+xml', 2048, profileId]
    );

    console.log(`🎭 Created cartoon user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
  }

  // Create mutual likes for anna@test.ru
  console.log('\n💕 Creating mutual likes for anna@test.ru...');
  await createMutualLikes(dataSource, 'anna@test.ru', [
    'shrek@swamp.ru',
    'woody@andys.ru', 
    'simba@pridelands.ru',
    'aladdin@agrabah.ru',
    'dmitry@test.ru',
  ]);

  console.log('\n✅ Seed completed!');
  console.log(`📊 Total users created: ${TEST_USERS.length + CARTOON_USERS.length}`);
  console.log('\n🔑 Test password for all accounts: Тест1пароль');
  await app.close();
}

async function createMutualLikes(dataSource: DataSource, mainUserEmail: string, matchEmails: string[]) {
  // Get main user ID
  const mainUserResult = await dataSource.query(
    'SELECT id FROM users WHERE email = $1',
    [mainUserEmail]
  );

  if (mainUserResult.length === 0) {
    console.log(`❌ User ${mainUserEmail} not found, skipping mutual likes...`);
    return;
  }

  const mainUserId = mainUserResult[0].id;

  for (const matchEmail of matchEmails) {
    // Get match user ID
    const matchUserResult = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [matchEmail]
    );

    if (matchUserResult.length === 0) {
      console.log(`❌ User ${matchEmail} not found, skipping...`);
      continue;
    }

    const matchUserId = matchUserResult[0].id;

    // Check if likes already exist
    const existingLike1 = await dataSource.query(
      'SELECT id FROM likes WHERE "fromUserId" = $1 AND "toUserId" = $2',
      [mainUserId, matchUserId]
    );

    const existingLike2 = await dataSource.query(
      'SELECT id FROM likes WHERE "fromUserId" = $1 AND "toUserId" = $2',
      [matchUserId, mainUserId]
    );

    // Create like from main user to match user
    if (existingLike1.length === 0) {
      await dataSource.query(
        `INSERT INTO likes (id, "fromUserId", "toUserId", type) VALUES ($1, $2, $3, 'like')`,
        [uuidv4(), mainUserId, matchUserId]
      );
    }

    // Create like from match user to main user (mutual)
    if (existingLike2.length === 0) {
      await dataSource.query(
        `INSERT INTO likes (id, "fromUserId", "toUserId", type) VALUES ($1, $2, $3, 'like')`,
        [uuidv4(), matchUserId, mainUserId]
      );
    }

    // Check if match already exists
    const existingMatch = await dataSource.query(
      `SELECT id FROM matches WHERE 
       ("user1Id" = $1 AND "user2Id" = $2) OR 
       ("user1Id" = $2 AND "user2Id" = $1)`,
      [mainUserId, matchUserId]
    );

    // Create match record if not exists
    if (existingMatch.length === 0) {
      await dataSource.query(
        `INSERT INTO matches (id, "user1Id", "user2Id") VALUES ($1, $2, $3)`,
        [uuidv4(), mainUserId, matchUserId]
      );
    }

    console.log(`💖 Created mutual like: ${mainUserEmail} <-> ${matchEmail}`);
  }
}

seed().catch(console.error);

