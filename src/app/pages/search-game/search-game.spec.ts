import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SearchGame } from './search-game';

describe('SearchGame', () => {
  let component: SearchGame;
  let fixture: ComponentFixture<SearchGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchGame],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
