import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonMoveSelector } from './pokemon-move-selector';

describe('PokemonMoveSelector', () => {
  let component: PokemonMoveSelector;
  let fixture: ComponentFixture<PokemonMoveSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonMoveSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokemonMoveSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
