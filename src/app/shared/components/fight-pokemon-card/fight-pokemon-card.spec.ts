import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightPokemonCard } from './fight-pokemon-card';

describe('FightPokemonCard', () => {
  let component: FightPokemonCard;
  let fixture: ComponentFixture<FightPokemonCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightPokemonCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightPokemonCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
