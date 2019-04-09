import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-who-uses',
  templateUrl: './who-uses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./who-uses.component.scss'],
})
export class WhoUsesComponent extends BasePageComponent {
  readonly companies = [
    {
      logo: 'https://nestjs.com/img/valor-software.png',
      url: 'https://valor-software.com/',
    },
    {
      logo: '/assets/logo/rewe.svg',
      url: 'https://rewe-digital.com/',
      width: '180px',
    },
    {
      logo: '/assets/logo/roche-logo.png',
      url: 'https://roche.com',
      width: '90px',
    },
    {
      logo: '/assets/logo/adidas.svg',
      url: 'https://adidas.com',
      width: '80px',
    },
    {
      logo: '/assets/logo/capgemini.svg',
      url: 'https://capgemini.com',
    },
    {
      logo: 'https://nestjs.com/img/gojob-logo.png',
      url: 'https://gojob.com/',
      width: '100px',
    },
    {
      logo: 'https://nestjs.com/img/neoteric.png',
      url: 'https://neoteric.eu/',
    },
    {
      logo: '/assets/logo/trellis.png',
      url: 'https://trellis.org/',
      width: '70px',
    },
    {
      logo: 'https://nestjs.com/img/scalio-logo.svg',
      url: 'https://scal.io',
      width: '120px',
    },
    {
      logo: 'https://nestjs.com/img/swingdev-logo.svg',
      url: 'https://swingdev.io/',
    },
    {
      logo: '/assets/logo/architectnow.png',
      url: 'http://architectnow.net',
      width: '150px',
    },
    {
      logo: '/assets/logo/iflix.svg',
      url: 'https://www.iflix.com',
      width: '70px',
    },
    {
      logo: 'https://nestjs.com/img/genuinebee.svg',
      url: 'https://genuinebee.com/',
    },
    {
      logo: '/assets/logo/run-players-league.png',
      url: 'https://runplayersleague.com',
      width: '80px',
    },
    {
      logo: '/assets/logo/yanrongyun.svg',
      url: 'http://www.yanrongyun.com',
      width: '120px',
    },
    {
      logo: '/assets/logo/sclable.svg',
      url: 'https://sclable.com',
      width: '120px',
    },
  ];

  readonly companiesUrls = [
    'https://gorrion.io/',
    'http://balticdatascience.com/',
    'https://prohabits.com/',
    'https://komed-health.com/',
    'https://kerberus.com.co/',
    'http://xtremis.com/',
    'https://notadd.com/',
    'http://jsdaddy.io/',
    'https://yumpingo.com/',
    'https://analytics-importer.cz/',
    'https://dayzim.com/',
    'https://wizkids.co.uk/',
    'https://pilvia.com/',
    'https://wi-q.com/',
    'http://agrofel.com.br',
    'https://societegenerale.com/',
    'https://trashpanda.hulan.nl/',
    'https://bytedance.com/',
    'https://votercircle.com',
    'https://erento.com',
    'https://ideas.manticore-labs.com/',
    'https://smartexlab.com/',
    'https://automama.ru/',
    'https://iflix.com/',
    'https://culturacolectiva.com',
    'https://framework.watch',
    'https://mobilejazz.com/',
    'https://cgiandi.com/',
    'https://www.titlex.com.au/',
    'https://codengage.com/',
    'https://budacode.com/',
    'https://blueanchor.io/',
    'https://www.easymetrics.com/',
    'https://getapollo.io/',
    'https://big-bench.com/',
  ];
}
