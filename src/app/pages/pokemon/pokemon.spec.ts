import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonPage } from './pokemon';

describe('Pokemon', () => {
  let component: PokemonPage;
  let fixture: ComponentFixture<PokemonPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokemonPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
