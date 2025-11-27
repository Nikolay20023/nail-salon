import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mainButton } from '@tma.js/sdk-react';
import { 
  Section, 
  Cell, 
  List, 
  Input,
  Title,
  Spinner
} from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

import './MasterWidget.css';

export function MasterWidget() {
  const navigate = useNavigate();
  const { masterId } = useParams<{ masterId?: string }>();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Если есть masterId, загрузить данные мастера
    if (masterId) {
      // const masterData = await api.getMaster(masterId);
      // setName(masterData.name);
      // setDescription(masterData.description);
    }
  }, [masterId]);

  useEffect(() => {
    // Настройка MainButton для сохранения
    mainButton.setParams({
      text: 'Сохранить',
      isVisible: true,
      isEnabled: true,
    });

    const handleSave = async () => {
      setLoading(true);
      try {
        // TODO: Реализовать сохранение данных мастера
        console.log('Сохранение мастера:', { name, description });
        // await api.saveMaster({ name, description });
        
        // Показать уведомление об успехе
        alert('Данные успешно сохранены!');
      } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка при сохранении данных');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = mainButton.onClick(handleSave);

    return () => {
      unsubscribe();
      mainButton.hide();
    };
  }, [name, description]);

  if (loading) {
    return (
      <Page back={true}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <Spinner size="l" />
        </div>
      </Page>
    );
  }

  return (
    <Page back={true}>
      <div className="master-widget">
        <Section>
          <Title weight="1" level="1">
            {masterId ? 'Редактировать мастера' : 'Новый мастер'}
          </Title>
        </Section>

        <Section header="Основная информация">
          <div className="form-field">
            <label htmlFor="name">Название</label>
            <Input
              id="name"
              type="text"
              placeholder="Введите имя мастера"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">Описание</label>
            <Input
              id="description"
              type="text"
              placeholder="Введите описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Section>

        <Section header="Дополнительно">
          <List>
            <Cell
              onClick={() => navigate(`/master/${masterId || 'new'}/services`)}
              subtitle="Настроить список услуг"
              after="›"
            >
              Услуги
            </Cell>
            
            <Cell
              onClick={() => navigate(`/master/${masterId || 'new'}/schedule`)}
              subtitle="Настроить график работы"
              after="›"
            >
              Расписание
            </Cell>
          </List>
        </Section>
      </div>
    </Page>
  );
}

