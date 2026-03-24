import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightLog } from './fight-log';

describe('FightLog', () => {
  let component: FightLog;
  let fixture: ComponentFixture<FightLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
