import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonCardList } from './pokemon-card-list';

describe('PokemonCardList', () => {
  let component: PokemonCardList;
  let fixture: ComponentFixture<PokemonCardList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCardList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokemonCardList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
