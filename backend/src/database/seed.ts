import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

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

// Placeholder image colors for generating simple avatars
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

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

async function seed() {
  console.log('Starting seed...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const hashedPassword = await bcrypt.hash('Тест1пароль', 12);

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

  console.log('Seed completed!');
  await app.close();
}

seed().catch(console.error);

