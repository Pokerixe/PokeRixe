import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchGame } from './search-game';

describe('SearchGame', () => {
  let component: SearchGame;
  let fixture: ComponentFixture<SearchGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
