/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, ContentChildren, Directive, EventEmitter, HostBinding, Input, OnChanges, Output, QueryList, ViewChildren} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {onlyInIvy} from '@angular/private/testing';

describe('inheritance', () => {
  onlyInIvy('View Engine does not provide this check')
      .it('should throw when trying to inherit a component from a directive', () => {
        @Component({
          selector: 'my-comp',
          template: '<div></div>',
        })
        class MyComponent {
        }

        @Directive({
          selector: '[my-dir]',
        })
        class MyDirective extends MyComponent {
        }

        @Component({
          template: `<div my-dir></div>`,
        })
        class App {
        }

        TestBed.configureTestingModule({
          declarations: [App, MyComponent, MyDirective],
        });

        expect(() => {
          TestBed.createComponent(App);
        }).toThrowError('Directives cannot inherit Components');
      });

  describe('ngOnChanges', () => {
    @Component({selector: 'app-comp', template: ``})
    class AppComp {
    }

    it('should be inherited when super is a directive', () => {
      const log: string[] = [];

      @Directive({selector: '[superDir]'})
      class SuperDirective implements OnChanges {
        @Input() someInput = '';

        ngOnChanges() { log.push('on changes!'); }
      }

      @Directive({selector: '[subDir]'})
      class SubDirective extends SuperDirective {
      }

      TestBed.configureTestingModule({declarations: [AppComp, SubDirective]});
      TestBed.overrideComponent(
          AppComp, {set: new Component({template: '<div subDir [someInput]="1"></div>'})});
      const fixture = TestBed.createComponent(AppComp);
      fixture.detectChanges();

      expect(log).toEqual(['on changes!']);
    });

    it('should be inherited when super is a simple class', () => {
      const log: string[] = [];

      class SuperClass {
        ngOnChanges() { log.push('on changes!'); }
      }

      @Directive({selector: '[subDir]'})
      class SubDirective extends SuperClass {
        @Input() someInput = '';
      }

      TestBed.configureTestingModule({declarations: [AppComp, SubDirective]});
      TestBed.overrideComponent(
          AppComp, {set: new Component({template: '<div subDir [someInput]="1"></div>'})});
      const fixture = TestBed.createComponent(AppComp);
      fixture.detectChanges();

      expect(log).toEqual(['on changes!']);
    });

    it('should be inherited when super is a directive and grand-super is a directive', () => {
      const log: string[] = [];

      @Directive({selector: '[grandSuperDir]'})
      class GrandSuperDirective implements OnChanges {
        @Input() someInput = '';

        ngOnChanges() { log.push('on changes!'); }
      }

      @Directive({selector: '[superDir]'})
      class SuperDirective extends GrandSuperDirective {
      }

      @Directive({selector: '[subDir]'})
      class SubDirective extends SuperDirective {
      }

      TestBed.configureTestingModule({declarations: [AppComp, SubDirective]});
      TestBed.overrideComponent(
          AppComp, {set: new Component({template: '<div subDir [someInput]="1"></div>'})});
      const fixture = TestBed.createComponent(AppComp);
      fixture.detectChanges();

      expect(log).toEqual(['on changes!']);
    });

    it('should be inherited when super is a directive and grand-super is a simple class', () => {
      const log: string[] = [];

      class GrandSuperClass {
        ngOnChanges() { log.push('on changes!'); }
      }

      @Directive({selector: '[superDir]'})
      class SuperDirective extends GrandSuperClass {
        @Input() someInput = '';
      }

      @Directive({selector: '[subDir]'})
      class SubDirective extends SuperDirective {
      }

      TestBed.configureTestingModule({declarations: [AppComp, SubDirective]});
      TestBed.overrideComponent(
          AppComp, {set: new Component({template: '<div subDir [someInput]="1"></div>'})});
      const fixture = TestBed.createComponent(AppComp);
      fixture.detectChanges();

      expect(log).toEqual(['on changes!']);
    });

    it('should be inherited when super is a simple class and grand-super is a directive', () => {
      const log: string[] = [];

      @Directive({selector: '[grandSuperDir]'})
      class GrandSuperDirective implements OnChanges {
        @Input() someInput = '';

        ngOnChanges() { log.push('on changes!'); }
      }

      class SuperClass extends GrandSuperDirective {}

      @Directive({selector: '[subDir]'})
      class SubDirective extends SuperClass {
      }

      TestBed.configureTestingModule({declarations: [AppComp, SubDirective]});
      TestBed.overrideComponent(
          AppComp, {set: new Component({template: '<div subDir [someInput]="1"></div>'})});
      const fixture = TestBed.createComponent(AppComp);
      fixture.detectChanges();

      expect(log).toEqual(['on changes!']);
    });

    it('should be inherited when super is a simple class and grand-super is a simple class', () => {
      const log: string[] = [];

      class GrandSuperClass {
        ngOnChanges() { log.push('on changes!'); }
      }

      class SuperClass extends GrandSuperClass {}

      @Directive({selector: '[subDir]'})
      class SubDirective extends SuperClass {
        @Input() someInput = '';
      }

      TestBed.configureTestingModule({declarations: [AppComp, SubDirective]});
      TestBed.overrideComponent(
          AppComp, {set: new Component({template: '<div subDir [someInput]="1"></div>'})});
      const fixture = TestBed.createComponent(AppComp);
      fixture.detectChanges();

      expect(log).toEqual(['on changes!']);
    });
  });

  describe('of bare super class by a directive', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      class SuperDirective {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      class SuperDirective {
        @Input()
        foo = '';

        @Input()
        bar = '';

        @Input()
        baz = '';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<p sub-dir [foo]="a" [bar]="b" [baz]="c" [qux]="d"></p>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir =
          fixture.debugElement.query(By.directive(SubDirective)).injector.get(SubDirective);

      expect(subDir.foo).toBe('a');
      expect(subDir.bar).toBe('b');
      expect(subDir.baz).toBe('c');
      expect(subDir.qux).toBe('d');
    });


    it('should inherit outputs', () => {
      class SuperDirective {
        @Output()
        foo = new EventEmitter<string>();
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        ngOnInit() { this.foo.emit('test'); }
      }

      @Component({
        template: `
        <div sub-dir (foo)="handleFoo($event)"></div>
      `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test');
    });

    it('should compose host bindings for styles', () => {
      class SuperDirective {
        @HostBinding('style.color')
        color = 'red';

        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
      }

      @Component({
        template: `
        <p sub-dir>test</p>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(SubDirective));

      expect(queryResult.nativeElement.tagName).toBe('P');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      class SuperDirective {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
      }
      @Component({
        template: `
        <p sub-dir superTitle="test">test</p>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(SubDirective));

      expect(queryResult.nativeElement.title).toBe('test!!!');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      class SuperDirective {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <ul sub-dir>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </ul>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, ChildDir],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });
  });

  describe('of a directive by another directive', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      @Directive({selector: '[super-dir]'})
      class SuperDirective {
        @Input()
        foo = '';

        @Input()
        bar = '';

        @Input()
        baz = '';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<p sub-dir [foo]="a" [bar]="b" [baz]="c" [qux]="d"></p>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir =
          fixture.debugElement.query(By.directive(SubDirective)).injector.get(SubDirective);

      expect(subDir.foo).toBe('a');
      expect(subDir.bar).toBe('b');
      expect(subDir.baz).toBe('c');
      expect(subDir.qux).toBe('d');
    });


    it('should inherit outputs', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @Output()
        foo = new EventEmitter<string>();
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        ngOnInit() { this.foo.emit('test'); }
      }

      @Component({
        template: `
        <div sub-dir (foo)="handleFoo($event)"></div>
      `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test');
    });

    it('should compose host bindings for styles', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @HostBinding('style.color')
        color = 'red';

        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
      }

      @Component({
        template: `
        <p sub-dir>test</p>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(SubDirective));

      expect(queryResult.nativeElement.tagName).toBe('P');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
      }
      @Component({
        template: `
        <p sub-dir superTitle="test">test</p>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(SubDirective));

      expect(queryResult.nativeElement.title).toBe('test!!!');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <ul sub-dir>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </ul>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, ChildDir, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });
  });

  describe('of a directive by a bare class then by another directive', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      @Directive({
        selector: '[super-dir]',
      })
      class SuperSuperDirective {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      class SuperDirective extends SuperSuperDirective {}

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Directive({
          selector: '[subDir]',
        })
        class SubDirective extends SuperDirective {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<p *ngIf="showing" subDir></p>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [SubDirective, App, SuperSuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      @Directive({selector: '[super-dir]'})
      class SuperSuperDirective {
        @Input()
        foo = '';

        @Input()
        baz = '';
      }

      class SuperDirective extends SuperSuperDirective {
        @Input()
        bar = '';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({
        selector: 'my-app',
        template: `<p sub-dir [foo]="a" [bar]="b" [baz]="c" [qux]="d"></p>`,
      })
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective, SuperSuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir =
          fixture.debugElement.query(By.directive(SubDirective)).injector.get(SubDirective);

      expect(subDir.foo).toBe('a');
      expect(subDir.bar).toBe('b');
      expect(subDir.baz).toBe('c');
      expect(subDir.qux).toBe('d');
    });

    it('should inherit outputs', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperSuperDirective {
        @Output()
        foo = new EventEmitter<string>();
      }

      class SuperDirective extends SuperSuperDirective {
        @Output()
        bar = new EventEmitter<string>();
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        ngOnInit() {
          this.foo.emit('test1');
          this.bar.emit('test2');
        }
      }

      @Component({
        template: `
          <div sub-dir (foo)="handleFoo($event)" (bar)="handleBar($event)"></div>
        `
      })
      class App {
        foo = '';

        bar = '';

        handleFoo(event: string) { this.foo = event; }

        handleBar(event: string) { this.bar = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective, SuperSuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test1');
      expect(app.bar).toBe('test2');
    });

    it('should compose host bindings for styles', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperSuperDirective {
        @HostBinding('style.color')
        color = 'red';
      }

      class SuperDirective extends SuperSuperDirective {
        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
      }

      @Component({
        template: `
          <p sub-dir>test</p>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective, SuperSuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(SubDirective));

      expect(queryResult.nativeElement.tagName).toBe('P');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperSuperDirective {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      class SuperDirective extends SuperSuperDirective {
        @HostBinding('accessKey')
        get boundAltKey() { return this.superAccessKey + '???'; }

        @Input()
        superAccessKey = '';
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
      }
      @Component({
        template: `
        <p sub-dir superTitle="test1" superAccessKey="test2">test</p>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, SuperDirective, SuperSuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const p: HTMLParagraphElement =
          fixture.debugElement.query(By.directive(SubDirective)).nativeElement;

      expect(p.title).toBe('test1!!!');
      expect(p.accessKey).toBe('test2???');
    });

    it('should inherit ContentChildren queries', () => {
      let foundChildDir1s: QueryList<ChildDir1>;
      let foundChildDir2s: QueryList<ChildDir2>;

      @Directive({selector: '[child-dir-one]'})
      class ChildDir1 {
      }

      @Directive({selector: '[child-dir-two]'})
      class ChildDir2 {
      }

      @Directive({
        selector: '[super-dir]',
      })
      class SuperSuperDirective {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir1)
        childDir1s !: QueryList<ChildDir1>;
      }

      class SuperDirective extends SuperSuperDirective {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir1)
        childDir2s !: QueryList<ChildDir2>;
      }

      @Directive({
        selector: '[sub-dir]',
      })
      class SubDirective extends SuperDirective {
        ngAfterViewInit() {
          foundChildDir1s = this.childDir1s;
          foundChildDir2s = this.childDir2s;
        }
      }

      @Component({
        template: `
        <ul sub-dir>
          <li child-dir-one child-dir-two>one</li>
          <li child-dir-one>two</li>
          <li child-dir-two>three</li>
        </ul>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SubDirective, ChildDir1, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundChildDir1s !.length).toBe(2);
      expect(foundChildDir2s !.length).toBe(2);
    });
  });

  describe('of bare super class by a component', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      class SuperComponent {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Component({selector: 'my-comp', template: `<p>test</p>`})
        class MyComponent extends SuperComponent {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Directive({
          selector: 'my-comp',
        })
        class MyComponent extends SuperComponent {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      class SuperComponent {
        @Input()
        foo = '';

        @Input()
        bar = '';

        @Input()
        baz = '';
      }

      @Component({selector: 'my-comp', template: `<p>test</p>`})
      class MyComponent extends SuperComponent {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<my-comp [foo]="a" [bar]="b" [baz]="c" [qux]="d"></my-comp>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir: MyComponent =
          fixture.debugElement.query(By.directive(MyComponent)).componentInstance;

      expect(subDir.foo).toEqual('a');
      expect(subDir.bar).toEqual('b');
      expect(subDir.baz).toEqual('c');
      expect(subDir.qux).toEqual('d');
    });


    it('should inherit outputs', () => {
      class SuperComponent {
        @Output()
        foo = new EventEmitter<string>();
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
        ngOnInit() { this.foo.emit('test'); }
      }

      @Component({
        template: `
          <my-comp (foo)="handleFoo($event)"></my-comp>
        `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test');
    });

    it('should compose host bindings for styles', () => {
      class SuperComponent {
        @HostBinding('style.color')
        color = 'red';

        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
      }

      @Component({
        template: `
          <my-comp>test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.tagName).toBe('MY-COMP');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      class SuperComponent {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
      }
      @Component({
        template: `
        <my-comp superTitle="test">test</my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.title).toBe('test!!!');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      class SuperComponent {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({selector: 'my-comp', template: `<ul><ng-content></ng-content></ul>`})
      class MyComponent extends SuperComponent {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, ChildDir],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });
  });

  describe('of a directive inherited by a component', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Component({selector: 'my-comp', template: `<p>test</p>`})
        class MyComponent extends SuperDirective {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperDirective {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperDirective {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperDirective {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperDirective {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperDirective {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperDirective {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @Input()
        foo = '';

        @Input()
        bar = '';

        @Input()
        baz = '';
      }

      @Component({selector: 'my-comp', template: `<p>test</p>`})
      class MyComponent extends SuperDirective {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<my-comp [foo]="a" [bar]="b" [baz]="c" [qux]="d"></my-comp>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir: MyComponent =
          fixture.debugElement.query(By.directive(MyComponent)).componentInstance;

      expect(subDir.foo).toEqual('a');
      expect(subDir.bar).toEqual('b');
      expect(subDir.baz).toEqual('c');
      expect(subDir.qux).toEqual('d');
    });

    it('should inherit outputs', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @Output()
        foo = new EventEmitter<string>();
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperDirective {
        ngOnInit() { this.foo.emit('test'); }
      }

      @Component({
        template: `
          <my-comp (foo)="handleFoo($event)"></my-comp>
        `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test');
    });

    it('should compose host bindings for styles', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @HostBinding('style.color')
        color = 'red';

        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperDirective {
      }

      @Component({
        template: `
          <my-comp>test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.tagName).toBe('MY-COMP');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperDirective {
      }
      @Component({
        template: `
        <my-comp superTitle="test">test</my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.title).toBe('test!!!');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({selector: 'my-comp', template: `<ul><ng-content></ng-content></ul>`})
      class MyComponent extends SuperDirective {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperDirective, ChildDir],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });

    it('should inherit ViewChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        // TODO(issue/24571): remove '!'.
        @ViewChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({
        selector: 'my-comp',
        template: `
          <ul>
            <li child-dir *ngFor="let item of items">{{item}}</li>
          </ul>
        `,
      })
      class MyComponent extends SuperDirective {
        items = [1, 2, 3, 4, 5];
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp></my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, ChildDir, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(5);
    });
  });

  describe('of a directive inherited by a bare class and then by a component', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      class BareClass extends SuperDirective {}

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Component({selector: 'my-comp', template: `<p>test</p>`})
        class MyComponent extends BareClass {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Directive({
          selector: 'my-comp',
        })
        class MyComponent extends BareClass {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends BareClass {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends BareClass {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends BareClass {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends BareClass {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends BareClass {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperDirective],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @Input()
        foo = '';

        @Input()
        baz = '';
      }

      class BareClass extends SuperDirective {
        @Input()
        bar = '';
      }

      @Component({selector: 'my-comp', template: `<p>test</p>`})
      class MyComponent extends BareClass {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<my-comp [foo]="a" [bar]="b" [baz]="c" [qux]="d"></my-comp>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, BareClass, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir: MyComponent =
          fixture.debugElement.query(By.directive(MyComponent)).componentInstance;

      expect(subDir.foo).toEqual('a');
      expect(subDir.bar).toEqual('b');
      expect(subDir.baz).toEqual('c');
      expect(subDir.qux).toEqual('d');
    });


    it('should inherit outputs', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @Output()
        foo = new EventEmitter<string>();
      }

      class BareClass extends SuperDirective {}

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends BareClass {
        ngOnInit() { this.foo.emit('test'); }
      }

      @Component({
        template: `
          <my-comp (foo)="handleFoo($event)"></my-comp>
        `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test');
    });

    it('should compose host bindings for styles', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @HostBinding('style.color')
        color = 'red';

        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      class BareClass extends SuperDirective {}

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends BareClass {
      }

      @Component({
        template: `
          <my-comp>test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.tagName).toBe('MY-COMP');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      class BareClass extends SuperDirective {
        @HostBinding('accessKey')
        get boundAccessKey() { return this.superAccessKey + '???'; }

        @Input()
        superAccessKey = '';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends BareClass {
      }
      @Component({
        template: `
          <my-comp superTitle="test1" superAccessKey="test2">test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, SuperDirective, BareClass, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.title).toBe('test1!!!');
      expect(queryResult.nativeElement.accessKey).toBe('test2???');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      class BareClass extends SuperDirective {}

      @Component({
        selector: 'my-comp',
        template: `<ul><ng-content></ng-content></ul>`,
      })
      class MyComponent extends BareClass {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, ChildDir, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });

    it('should inherit ViewChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Directive({
        selector: '[super-dir]',
      })
      class SuperDirective {
        // TODO(issue/24571): remove '!'.
        @ViewChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      class BareClass extends SuperDirective {}

      @Component({
        selector: 'my-comp',
        template: `
          <ul>
            <li child-dir *ngFor="let item of items">{{item}}</li>
          </ul>
        `,
      })
      class MyComponent extends BareClass {
        items = [1, 2, 3, 4, 5];
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp></my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, ChildDir, SuperDirective],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(5);
    });
  });

  describe('of a component inherited by a component', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        @Input()
        foo = '';

        @Input()
        bar = '';

        @Input()
        baz = '';
      }

      @Component({selector: 'my-comp', template: `<p>test</p>`})
      class MyComponent extends SuperComponent {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<my-comp [foo]="a" [bar]="b" [baz]="c" [qux]="d"></my-comp>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const subDir: MyComponent =
          fixture.debugElement.query(By.directive(MyComponent)).componentInstance;

      expect(subDir.foo).toEqual('a');
      expect(subDir.bar).toEqual('b');
      expect(subDir.baz).toEqual('c');
      expect(subDir.qux).toEqual('d');
    });

    it('should inherit outputs', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        @Output()
        foo = new EventEmitter<string>();
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
        ngOnInit() { this.foo.emit('test'); }
      }

      @Component({
        template: `
          <my-comp (foo)="handleFoo($event)"></my-comp>
        `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test');
    });

    it('should compose host bindings for styles', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        @HostBinding('style.color')
        color = 'red';

        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
      }

      @Component({
        template: `
          <my-comp>test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.tagName).toBe('MY-COMP');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
      }
      @Component({
        template: `
        <my-comp superTitle="test">test</my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.title).toBe('test!!!');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({
        selector: 'my-comp',
        template: `<ul><ng-content></ng-content></ul>`,
      })
      class MyComponent extends SuperComponent {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent, ChildDir],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });

    it('should inherit ViewChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        // TODO(issue/24571): remove '!'.
        @ViewChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({
        selector: 'my-comp',
        template: `
          <ul>
            <li child-dir *ngFor="let item of items">{{item}}</li>
          </ul>
        `,
      })
      class MyComponent extends SuperComponent {
        items = [1, 2, 3, 4, 5];
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp></my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, ChildDir, SuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(5);
    });
  });

  describe('of a component inherited by a bare class then by a component', () => {
    describe('lifecycle hooks', () => {
      const fired: string[] = [];

      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperSuperComponent {
        ngOnInit() { fired.push('super init'); }
        ngOnDestroy() { fired.push('super destroy'); }
        ngAfterContentInit() { fired.push('super after content init'); }
        ngAfterContentChecked() { fired.push('super after content checked'); }
        ngAfterViewInit() { fired.push('super after view init'); }
        ngAfterViewChecked() { fired.push('super after view checked'); }
        ngDoCheck() { fired.push('super do check'); }
      }

      class SuperComponent extends SuperSuperComponent {}

      beforeEach(() => fired.length = 0);

      it('ngOnInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngOnInit() { fired.push('sub init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngDoCheck', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngDoCheck() { fired.push('sub do check'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'sub do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterContentInit() { fired.push('sub after content init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'sub after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterContentChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterContentChecked() { fired.push('sub after content checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'sub after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewInit', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterViewInit() { fired.push('sub after view init'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'sub after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngAfterViewChecked', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngAfterViewChecked() { fired.push('sub after view checked'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'sub after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'super destroy',
        ]);
      });

      it('ngOnDestroy', () => {
        @Component({
          selector: 'my-comp',
          template: `<p>test</p>`,
        })
        class MyComponent extends SuperComponent {
          ngOnDestroy() { fired.push('sub destroy'); }
        }

        @Component({
          template: `<my-comp *ngIf="showing"></my-comp>`,
        })
        class App {
          showing = true;
        }

        TestBed.configureTestingModule({
          declarations: [MyComponent, App, SuperComponent],
        });
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();

        expect(fired).toEqual([
          'super init',
          'super do check',
          'super after content init',
          'super after content checked',
          'super after view init',
          'super after view checked',
        ]);

        fired.length = 0;
        fixture.componentInstance.showing = false;
        fixture.detectChanges();

        expect(fired).toEqual([
          'sub destroy',
        ]);
      });
    });

    it('should inherit inputs', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperSuperComponent {
        @Input()
        foo = '';

        @Input()
        baz = '';
      }

      class BareClass extends SuperSuperComponent {
        @Input()
        bar = '';
      }

      @Component({selector: 'my-comp', template: `<p>test</p>`})
      class MyComponent extends BareClass {
        @Input()
        baz = '';

        @Input()
        qux = '';
      }

      @Component({template: `<my-comp [foo]="a" [bar]="b" [baz]="c" [qux]="d"></my-comp>`})
      class App {
        a = 'a';
        b = 'b';
        c = 'c';
        d = 'd';
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperSuperComponent, BareClass],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const myComp: MyComponent =
          fixture.debugElement.query(By.directive(MyComponent)).componentInstance;

      expect(myComp.foo).toEqual('a');
      expect(myComp.bar).toEqual('b');
      expect(myComp.baz).toEqual('c');
      expect(myComp.qux).toEqual('d');
    });

    it('should inherit outputs', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperSuperComponent {
        @Output()
        foo = new EventEmitter<string>();
      }

      class SuperComponent extends SuperSuperComponent {
        @Output()
        bar = new EventEmitter<string>();
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
        ngOnInit() {
          this.foo.emit('test1');
          this.bar.emit('test2');
        }
      }

      @Component({
        template: `
          <my-comp (foo)="handleFoo($event)" (bar)="handleBar($event)"></my-comp>
        `
      })
      class App {
        foo = '';

        handleFoo(event: string) { this.foo = event; }

        bar = '';

        handleBar(event: string) { this.bar = event; }
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent, SuperSuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.foo).toBe('test1');
      expect(app.bar).toBe('test2');
    });

    it('should compose host bindings for styles', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperSuperComponent {
        @HostBinding('style.color')
        color = 'red';
      }

      class SuperComponent extends SuperSuperComponent {
        @HostBinding('style.backgroundColor')
        bg = 'black';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
      }

      @Component({
        template: `
          <my-comp>test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent, SuperSuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.tagName).toBe('MY-COMP');
      expect(queryResult.nativeElement.style.color).toBe('red');
      expect(queryResult.nativeElement.style.backgroundColor).toBe('black');
    });

    it('should compose host bindings (non-style related)', () => {
      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperSuperComponent {
        @HostBinding('title')
        get boundTitle() { return this.superTitle + '!!!'; }

        @Input()
        superTitle = '';
      }

      class SuperComponent extends SuperSuperComponent {
        @HostBinding('accessKey')
        get boundAccessKey() { return this.superAccessKey + '???'; }

        @Input()
        superAccessKey = '';
      }

      @Component({
        selector: 'my-comp',
        template: `<p>test</p>`,
      })
      class MyComponent extends SuperComponent {
      }
      @Component({
        template: `
          <my-comp superTitle="test1" superAccessKey="test2">test</my-comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent, SuperSuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const queryResult = fixture.debugElement.query(By.directive(MyComponent));

      expect(queryResult.nativeElement.tagName).toBe('MY-COMP');
      expect(queryResult.nativeElement.title).toBe('test1!!!');
      expect(queryResult.nativeElement.accessKey).toBe('test2???');
    });

    it('should inherit ContentChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        // TODO(issue/24571): remove '!'.
        @ContentChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({
        selector: 'my-comp',
        template: `<ul><ng-content></ng-content></ul>`,
      })
      class MyComponent extends SuperComponent {
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp>
          <li child-dir>one</li>
          <li child-dir>two</li>
        </my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, SuperComponent, ChildDir],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(2);
    });

    it('should inherit ViewChildren queries', () => {
      let foundQueryList: QueryList<ChildDir>;

      @Directive({selector: '[child-dir]'})
      class ChildDir {
      }

      @Component({
        selector: 'super-comp',
        template: `<p>super</p>`,
      })
      class SuperComponent {
        // TODO(issue/24571): remove '!'.
        @ViewChildren(ChildDir)
        customDirs !: QueryList<ChildDir>;
      }

      @Component({
        selector: 'my-comp',
        template: `
          <ul>
            <li child-dir *ngFor="let item of items">{{item}}</li>
          </ul>
        `,
      })
      class MyComponent extends SuperComponent {
        items = [1, 2, 3, 4, 5];
        ngAfterViewInit() { foundQueryList = this.customDirs; }
      }

      @Component({
        template: `
        <my-comp></my-comp>
      `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, MyComponent, ChildDir, SuperComponent],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(foundQueryList !.length).toBe(5);
    });
  });
});
