import Notifications from '../components/Notifications';

      <Header className="bg-white flex justify-between items-center px-6 shadow">
        <div className="flex items-center">
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger text-lg',
            onClick: () => setCollapsed(!collapsed),
          })}
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Space className="cursor-pointer">
              <Avatar icon={<UserOutlined />} />
              <span>{user?.fullName}</span>
              <DownOutlined />
            </Space>
          </Dropdown>
        </div>
      </Header> 
 
 