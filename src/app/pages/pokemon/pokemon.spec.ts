import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PokemonPage } from './pokemon';

describe('Pokemon', () => {
  let component: PokemonPage;
  let fixture: ComponentFixture<PokemonPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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
