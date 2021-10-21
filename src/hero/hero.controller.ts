import { Controller, Get, Inject, OnModuleInit, Param } from '@nestjs/common';
import {
  ClientGrpc,
  GrpcMethod,
  GrpcStreamMethod,
} from '@nestjs/microservices';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { HeroById } from './interfaces/hero-by-id.interface';
import { Hero } from './interfaces/hero.interface';

interface HeroService {
  findOne(data: HeroById): Observable<Hero>;
  findMany(upstream: Observable<HeroById>): Observable<Hero>;
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

  @Get()
  getMany(): Observable<Hero[]> {
    const ids$ = new ReplaySubject<HeroById>();
    ids$.next({ id: 1 });
    ids$.next({ id: 2 });
    ids$.complete();

    const stream = this.heroService.findMany(ids$.asObservable());
    return stream.pipe(toArray());
  }

  @Get(':id')
  getById(@Param('id') id: string): Observable<Hero> {
    return this.heroService.findOne({ id: +id });
  }

  @GrpcMethod('HeroService')
  async findOne(data: HeroById): Promise<Hero> {
    return await this.userServiceGetUserById(data.id)
  }

  private promises = [];
  @GrpcStreamMethod('HeroService')
  findMany(data$: Observable<HeroById>): Observable<Hero> {
    const hero$ = new Subject<Hero>();

    const onNext = async (heroById: HeroById) => {
      //const item = this.items.find(({id}) => id === heroById.id)
      this.promises.push(this.userServiceGetUserById(heroById.id).then((item) => {
        hero$.next(item)
      }))
    };

    const onComplete = () => {
      Promise.all(this.promises)
      .then(() => {
        // Clear promises
        this.promises = []
        hero$.complete()
      })
    }

    data$.subscribe({
      next: onNext,
      complete: onComplete,
    });

    return hero$.asObservable();
  }

  userServiceGetUserById(heroId: number): Promise<Hero> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.items.find(({id}) => id === heroId))
      }, 1000);
    });
  }
}

