/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InitialStylingFlags} from '../../src/core';
import {MockDirectory, setup} from '../aot/test_util';

import {compile, expectEmit} from './mock_compile';

describe('compiler compliance: styling', () => {
  const angularFiles = setup({
    compileAngular: true,
    compileAnimations: false,
    compileCommon: true,
  });

  describe('[style] and [style.prop]', () => {
    it('should create style instructions on the element', () => {
      const files = {
        app: {
          'spec.ts': `
                import {Component, NgModule} from '@angular/core';

                @Component({
                  selector: 'my-component',
                  template: \`<div [style]="myStyleExp"></div>\`
                })
                export class MyComponent {
                  myStyleExp = [{color:'red'}, {color:'blue', duration:1000}]
                }

                @NgModule({declarations: [MyComponent]})
                export class MyModule {}
            `
        }
      };

      const template = `
          template: function MyComponent_Template(rf: $RenderFlags$, $ctx$: $MyComponent$) {
            if (rf & 1) {
              $r3$.ɵE(0, 'div');
              $r3$.ɵs();
              $r3$.ɵe();
            }
            if (rf & 2) {
              $r3$.ɵsm(0, $ctx$.myStyleExp);
              $r3$.ɵsa(0);
            }
          }
          `;

      const result = compile(files, angularFiles);
      expectEmit(result.source, template, 'Incorrect template');
    });

    it('should place initial, multi, singular and application followed by attribute style instructions in the template code in that order',
       () => {
         const files = {
           app: {
             'spec.ts': `
                import {Component, NgModule} from '@angular/core';

                @Component({
                  selector: 'my-component',
                  template: \`<div style="opacity:1"
                                   [attr.style]="'border-width: 10px'"
                                   [style.width]="myWidth"
                                   [style]="myStyleExp"
                                   [style.height]="myHeight"></div>\`
                })
                export class MyComponent {
                  myStyleExp = [{color:'red'}, {color:'blue', duration:1000}]
                  myWidth = '100px';
                  myHeight = '100px';
                }

                @NgModule({declarations: [MyComponent]})
                export class MyModule {}
            `
           }
         };

         const template = `
          const _c0 = ['opacity','width','height',${InitialStylingFlags.VALUES_MODE},'opacity','1'];
          class MyComponent {
            static ngComponentDef = i0.ɵdefineComponent({
              type: MyComponent,
              selectors:[['my-component']],
              factory:function MyComponent_Factory(){
                return new MyComponent();
              },
              template: function MyComponent_Template(rf: $RenderFlags$, $ctx$: $MyComponent$) {
                if (rf & 1) {
                  $r3$.ɵE(0, 'div');
                  $r3$.ɵs(_c0);
                  $r3$.ɵe();
                }
                if (rf & 2) {
                  $r3$.ɵsm(0, $ctx$.myStyleExp);
                  $r3$.ɵsp(0, 1, $ctx$.myWidth);
                  $r3$.ɵsp(0, 2, $ctx$.myHeight);
                  $r3$.ɵsa(0);
                  $r3$.ɵa(0, 'style', $r3$.ɵb('border-width: 10px'));
                }
              }
            });
        `;

         const result = compile(files, angularFiles);
         expectEmit(result.source, template, 'Incorrect template');
       });
  });

  describe('[class]', () => {
    it('should create class styling instructions on the element', () => {
      const files = {
        app: {
          'spec.ts': `
                import {Component, NgModule} from '@angular/core';

                @Component({
                  selector: 'my-component',
                  template: \`<div [class]="myClassExp"></div>\`
                })
                export class MyComponent {
                  myClassExp = {'foo':true}
                }

                @NgModule({declarations: [MyComponent]})
                export class MyModule {}
            `
        }
      };

      const template = `
          template: function MyComponent_Template(rf: $RenderFlags$, $ctx$: $MyComponent$) {
            if (rf & 1) {
              $r3$.ɵE(0, 'div');
              $r3$.ɵs();
              $r3$.ɵe();
            }
            if (rf & 2) {
              $r3$.ɵsm(0,(null as any),$ctx$.myClassExp);
              $r3$.ɵsa(0);
            }
          }
          `;

      const result = compile(files, angularFiles);
      expectEmit(result.source, template, 'Incorrect template');
    });

    it('should place initial, multi, singular and application followed by attribute class instructions in the template code in that order',
       () => {
         const files = {
           app: {
             'spec.ts': `
                import {Component, NgModule} from '@angular/core';

                @Component({
                  selector: 'my-component',
                  template: \`<div class="grape"
                                   [attr.class]="'banana'"
                                   [class.apple]="yesToApple"
                                   [class]="myClassExp"
                                   [class.orange]="yesToOrange"></div>\`
                })
                export class MyComponent {
                  myClassExp = {a:true, b:true};
                  yesToApple = true;
                  yesToOrange = true;
                }

                @NgModule({declarations: [MyComponent]})
                export class MyModule {}
            `
           }
         };

         const template = `
          const _c0 = ['grape','apple','orange',${InitialStylingFlags.VALUES_MODE},'grape',true];
          class MyComponent {
            static ngComponentDef = i0.ɵdefineComponent({
              type: MyComponent,
              selectors:[['my-component']],
              factory:function MyComponent_Factory(){
                return new MyComponent();
              },
              template: function MyComponent_Template(rf: $RenderFlags$, $ctx$: $MyComponent$) {
                if (rf & 1) {
                  $r3$.ɵE(0, 'div');
                  $r3$.ɵs((null as any), _c0);
                  $r3$.ɵe();
                }
                if (rf & 2) {
                  $r3$.ɵsm(0, (null as any), $ctx$.myClassExp);
                  $r3$.ɵcp(0, 1, $ctx$.yesToApple);
                  $r3$.ɵcp(0, 2, $ctx$.yesToOrange);
                  $r3$.ɵsa(0);
                  $r3$.ɵa(0, 'class', $r3$.ɵb('banana'));
                }
              }
            });
        `;

         const result = compile(files, angularFiles);
         expectEmit(result.source, template, 'Incorrect template');
       });

    it('should not generate the styling apply instruction if there are only static style/class attributes',
       () => {
         const files = {
           app: {
             'spec.ts': `
                import {Component, NgModule} from '@angular/core';

                @Component({
                  selector: 'my-component',
                  template: \`<div class="foo"
                                   style="width:100px"
                                   [attr.class]="'round'"
                                   [attr.style]="'height:100px'"></div>\`
                })
                export class MyComponent {}

                @NgModule({declarations: [MyComponent]})
                export class MyModule {}
            `
           }
         };

         const template = `
          const _c0 = ['width',${InitialStylingFlags.VALUES_MODE},'width','100px'];
          const _c1 = ['foo',${InitialStylingFlags.VALUES_MODE},'foo',true];
          class MyComponent {
            static ngComponentDef = i0.ɵdefineComponent({
              type: MyComponent,
              selectors:[['my-component']],
              factory:function MyComponent_Factory(){
                return new MyComponent();
              },
              template: function MyComponent_Template(rf: $RenderFlags$, $ctx$: $MyComponent$) {
                if (rf & 1) {
                  $r3$.ɵE(0, 'div');
                  $r3$.ɵs(_c0, _c1);
                  $r3$.ɵe();
                }
                if (rf & 2) {
                  $r3$.ɵa(0, 'class', $r3$.ɵb('round'));
                  $r3$.ɵa(0, 'style', $r3$.ɵb('height:100px'));
                }
              }
            });
        `;

         const result = compile(files, angularFiles);
         expectEmit(result.source, template, 'Incorrect template');
       });
  });
});
