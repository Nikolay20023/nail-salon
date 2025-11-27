import { useParams } from 'react-router-dom';
import { 
  Section, 
  Title,
  Placeholder
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

import './MasterServices.css';

export function MasterServices() {
  const { masterId } = useParams<{ masterId: string }>();

  return (
    <Page back={true}>
      <div className="master-services">
        <Section>
          <Title weight="1" level="1">Услуги мастера</Title>
        </Section>

        <Placeholder
          header="В разработке"
          description={`Здесь будет список услуг для мастера ${masterId || 'new'}`}
        >
          <img
            alt="Coming soon"
            src="https://xelene.me/telegram.gif"
            style={{ display: 'block', width: '144px', height: '144px' }}
          />
        </Placeholder>
      </div>
    </Page>
  );
}

