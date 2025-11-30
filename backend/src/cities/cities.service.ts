import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { City } from './entities/city.entity';

// Major Russian cities with population > 1000
const RUSSIAN_CITIES = [
  { name: 'Москва', region: 'Москва', population: 12655050 },
  { name: 'Санкт-Петербург', region: 'Санкт-Петербург', population: 5384342 },
  { name: 'Новосибирск', region: 'Новосибирская область', population: 1625631 },
  { name: 'Екатеринбург', region: 'Свердловская область', population: 1493749 },
  { name: 'Казань', region: 'Республика Татарстан', population: 1257391 },
  { name: 'Нижний Новгород', region: 'Нижегородская область', population: 1252236 },
  { name: 'Красноярск', region: 'Красноярский край', population: 1092855 },
  { name: 'Челябинск', region: 'Челябинская область', population: 1196680 },
  { name: 'Самара', region: 'Самарская область', population: 1156659 },
  { name: 'Уфа', region: 'Республика Башкортостан', population: 1128787 },
  { name: 'Ростов-на-Дону', region: 'Ростовская область', population: 1137904 },
  { name: 'Краснодар', region: 'Краснодарский край', population: 932629 },
  { name: 'Омск', region: 'Омская область', population: 1154507 },
  { name: 'Воронеж', region: 'Воронежская область', population: 1058261 },
  { name: 'Пермь', region: 'Пермский край', population: 1055397 },
  { name: 'Волгоград', region: 'Волгоградская область', population: 1008998 },
  { name: 'Саратов', region: 'Саратовская область', population: 838042 },
  { name: 'Тюмень', region: 'Тюменская область', population: 816800 },
  { name: 'Тольятти', region: 'Самарская область', population: 699429 },
  { name: 'Ижевск', region: 'Удмуртская Республика', population: 648944 },
  { name: 'Барнаул', region: 'Алтайский край', population: 632391 },
  { name: 'Ульяновск', region: 'Ульяновская область', population: 627705 },
  { name: 'Иркутск', region: 'Иркутская область', population: 623424 },
  { name: 'Хабаровск', region: 'Хабаровский край', population: 617473 },
  { name: 'Ярославль', region: 'Ярославская область', population: 608722 },
  { name: 'Владивосток', region: 'Приморский край', population: 605049 },
  { name: 'Махачкала', region: 'Республика Дагестан', population: 601286 },
  { name: 'Томск', region: 'Томская область', population: 576624 },
  { name: 'Оренбург', region: 'Оренбургская область', population: 564773 },
  { name: 'Кемерово', region: 'Кемеровская область', population: 556382 },
  { name: 'Новокузнецк', region: 'Кемеровская область', population: 549103 },
  { name: 'Рязань', region: 'Рязанская область', population: 538962 },
  { name: 'Астрахань', region: 'Астраханская область', population: 529793 },
  { name: 'Пенза', region: 'Пензенская область', population: 516450 },
  { name: 'Набережные Челны', region: 'Республика Татарстан', population: 533907 },
  { name: 'Липецк', region: 'Липецкая область', population: 508573 },
  { name: 'Тула', region: 'Тульская область', population: 468333 },
  { name: 'Киров', region: 'Кировская область', population: 507155 },
  { name: 'Чебоксары', region: 'Чувашская Республика', population: 497618 },
  { name: 'Калининград', region: 'Калининградская область', population: 489359 },
  { name: 'Брянск', region: 'Брянская область', population: 405723 },
  { name: 'Курск', region: 'Курская область', population: 452976 },
  { name: 'Иваново', region: 'Ивановская область', population: 401505 },
  { name: 'Магнитогорск', region: 'Челябинская область', population: 413253 },
  { name: 'Улан-Удэ', region: 'Республика Бурятия', population: 437565 },
  { name: 'Тверь', region: 'Тверская область', population: 424969 },
  { name: 'Ставрополь', region: 'Ставропольский край', population: 454488 },
  { name: 'Сочи', region: 'Краснодарский край', population: 443562 },
  { name: 'Белгород', region: 'Белгородская область', population: 391554 },
  { name: 'Архангельск', region: 'Архангельская область', population: 346979 },
  { name: 'Владимир', region: 'Владимирская область', population: 352681 },
  { name: 'Курган', region: 'Курганская область', population: 310928 },
  { name: 'Смоленск', region: 'Смоленская область', population: 325537 },
  { name: 'Калуга', region: 'Калужская область', population: 341892 },
  { name: 'Орел', region: 'Орловская область', population: 308838 },
  { name: 'Чита', region: 'Забайкальский край', population: 349005 },
  { name: 'Мурманск', region: 'Мурманская область', population: 282851 },
  { name: 'Вологда', region: 'Вологодская область', population: 312420 },
  { name: 'Саранск', region: 'Республика Мордовия', population: 318578 },
  { name: 'Тамбов', region: 'Тамбовская область', population: 291994 },
  { name: 'Грозный', region: 'Чеченская Республика', population: 305781 },
  { name: 'Якутск', region: 'Республика Саха', population: 322987 },
  { name: 'Кострома', region: 'Костромская область', population: 276929 },
  { name: 'Петрозаводск', region: 'Республика Карелия', population: 280711 },
  { name: 'Нижневартовск', region: 'Ханты-Мансийский АО', population: 278401 },
  { name: 'Йошкар-Ола', region: 'Республика Марий Эл', population: 278714 },
  { name: 'Новороссийск', region: 'Краснодарский край', population: 275796 },
  { name: 'Комсомольск-на-Амуре', region: 'Хабаровский край', population: 244768 },
  { name: 'Таганрог', region: 'Ростовская область', population: 248664 },
  { name: 'Сыктывкар', region: 'Республика Коми', population: 243534 },
  { name: 'Нальчик', region: 'Кабардино-Балкарская Республика', population: 265983 },
  { name: 'Нижнекамск', region: 'Республика Татарстан', population: 238880 },
  { name: 'Шахты', region: 'Ростовская область', population: 231774 },
  { name: 'Дзержинск', region: 'Нижегородская область', population: 226794 },
  { name: 'Орск', region: 'Оренбургская область', population: 225152 },
  { name: 'Братск', region: 'Иркутская область', population: 224419 },
  { name: 'Благовещенск', region: 'Амурская область', population: 226478 },
  { name: 'Ангарск', region: 'Иркутская область', population: 224630 },
  { name: 'Старый Оскол', region: 'Белгородская область', population: 223360 },
  { name: 'Великий Новгород', region: 'Новгородская область', population: 224286 },
  { name: 'Псков', region: 'Псковская область', population: 210501 },
  { name: 'Бийск', region: 'Алтайский край', population: 199768 },
  { name: 'Прокопьевск', region: 'Кемеровская область', population: 188289 },
  { name: 'Рыбинск', region: 'Ярославская область', population: 182333 },
  { name: 'Сургут', region: 'Ханты-Мансийский АО', population: 380632 },
];

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private citiesRepository: Repository<City>,
  ) {}

  async seedCities(): Promise<void> {
    const count = await this.citiesRepository.count();
    if (count > 0) {
      return; // Already seeded
    }

    const cities = RUSSIAN_CITIES.map((c) =>
      this.citiesRepository.create(c),
    );
    await this.citiesRepository.save(cities);
    console.log(`Seeded ${cities.length} cities`);
  }

  async findAll(): Promise<City[]> {
    return this.citiesRepository.find({
      order: { population: 'DESC' },
    });
  }

  async search(query: string): Promise<City[]> {
    if (!query || query.length < 2) {
      return this.findAll();
    }

    return this.citiesRepository.find({
      where: { name: Like(`%${query}%`) },
      order: { population: 'DESC' },
      take: 20,
    });
  }

  async findById(id: number): Promise<City | null> {
    return this.citiesRepository.findOne({ where: { id } });
  }
}

