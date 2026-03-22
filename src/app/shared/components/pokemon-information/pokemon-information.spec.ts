import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokemonInformation } from './pokemon-information';

describe('PokemonInformation', () => {
  let component: PokemonInformation;
  let fixture: ComponentFixture<PokemonInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonInformation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokemonInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
