import { Controller, Get, Inject, OnModuleInit, Param } from '@nestjs/common';
import {
  ClientGrpc,
  GrpcMethod,
} from '@nestjs/microservices';
import { HeroById } from './interfaces/hero-by-id.interface';
import { Hero } from './interfaces/hero.interface';

interface HeroService {
  findOne(data: HeroById): Hero;
}

@Controller('hero')
export class HeroController implements OnModuleInit {
  private readonly items: Hero[] = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  private heroService: HeroService;

  constructor(@Inject('HERO_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.heroService = this.client.getService<HeroService>('HeroService');
  }

  @Get(':id')
  getHero(): Hero {
    return this.heroService.findOne({ id: 1 });
  }

  @GrpcMethod('HeroService')
  async findOne(heroById: HeroById): Promise<Hero> {
    return await this.userServiceGetUserById(heroById.id)
  }

  userServiceGetUserById(heroId: number): Promise<Hero> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.items.find(({id}) => id === heroId))
      }, 1000);
    });
  }
}

